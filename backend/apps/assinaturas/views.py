from django.conf import settings
from django.db.models import Count, F, Q, Sum
from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.atendimentos.models import Atendimento
from apps.core.audit import AuditModelViewSetMixin, snapshot, write_audit_log
from apps.core.models import AuditLog
from apps.encaminhamentos.models import Encaminhamento
from apps.oficios.models import Oficio
from apps.usuarios.models import Usuario

from .models import Cobranca, Gabinete
from .mercado_pago import (
    MercadoPagoError,
    apply_payment_update,
    create_checkout_preference,
    get_payment,
    mark_cobranca_as_paid,
    validate_webhook_signature,
)
from .permissions import IsPlatformAdmin
from .serializers import CobrancaSerializer, GabineteSerializer, MinhaAssinaturaSerializer


class GabineteViewSet(AuditModelViewSetMixin, ModelViewSet):
    serializer_class = GabineteSerializer
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    search_fields = ["nome", "vereador", "email_responsavel", "status_licenca"]
    ordering_fields = ["nome", "status_licenca", "fim_licenca", "criado_em"]

    def get_queryset(self):
        queryset = Gabinete.objects.annotate(usuarios_count=Count("usuarios", distinct=True)).order_by("nome", "id")
        status_licenca = self.request.GET.get("status_licenca")
        risco = self.request.GET.get("risco")
        today = timezone.localdate()

        if status_licenca:
            queryset = queryset.filter(status_licenca=status_licenca)
        if risco == "vencendo":
            queryset = queryset.filter(fim_licenca__gte=today, fim_licenca__lte=today + timedelta(days=7))
        elif risco == "expirada":
            queryset = queryset.filter(Q(status_licenca=Gabinete.StatusLicenca.EXPIRADA) | Q(fim_licenca__lt=today))
        elif risco == "sem_usuarios":
            queryset = queryset.filter(usuarios_count=0)
        elif risco == "acima_limite":
            queryset = queryset.filter(usuarios_count__gt=F("limite_usuarios"))
        elif risco == "perto_limite":
            ids = [gabinete.id for gabinete in queryset if gabinete.limite_usuarios and gabinete.usuarios_count >= max(1, int(gabinete.limite_usuarios * 0.8))]
            queryset = queryset.filter(id__in=ids)
        elif risco == "cobranca_atrasada":
            queryset = queryset.filter(cobrancas__status=Cobranca.Status.ATRASADA).distinct()

        return queryset

    @action(detail=True, methods=["post"], url_path="cobrar")
    def cobrar(self, request, pk=None):
        if not settings.MERCADO_PAGO_ACCESS_TOKEN:
            return Response({"detail": "Configure MERCADO_PAGO_ACCESS_TOKEN no backend/.env para gerar cobranças."}, status=status.HTTP_400_BAD_REQUEST)

        gabinete = self.get_object()
        today = timezone.localdate()
        referencia = request.data.get("referencia") or today.strftime("%m/%Y")
        vencimento = request.data.get("vencimento") or today.isoformat()
        valor = request.data.get("valor") or gabinete.valor_mensal

        cobranca = Cobranca.objects.filter(gabinete=gabinete, referencia=referencia).order_by("-criado_em").first()
        created = cobranca is None
        if created:
            cobranca = Cobranca.objects.create(
                gabinete=gabinete,
                referencia=referencia,
                valor=valor,
                vencimento=vencimento,
                status=Cobranca.Status.ABERTA,
                metodo_pagamento=Cobranca.Metodo.PIX,
            )

        if not created and cobranca.status == Cobranca.Status.PAGA:
            return Response(
                {"detail": "Este gabinete já possui uma cobrança paga para essa referência."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not created:
            cobranca.valor = valor
            cobranca.vencimento = vencimento
            cobranca.status = Cobranca.Status.ABERTA
            cobranca.save(update_fields=["valor", "vencimento", "status", "atualizado_em"])

        try:
            payment_data = create_checkout_preference(cobranca)
        except MercadoPagoError as exc:
            if created:
                cobranca.delete()
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = CobrancaSerializer(cobranca)
        return Response({**serializer.data, "pagamento": payment_data}, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="renovar")
    def renovar(self, request, pk=None):
        gabinete = self.get_object()
        before = snapshot(gabinete)
        dias = int(request.data.get("dias") or 30)
        inicio = timezone.localdate()
        base = gabinete.fim_licenca if gabinete.fim_licenca and gabinete.fim_licenca >= inicio else inicio
        gabinete.status_licenca = Gabinete.StatusLicenca.ATIVA
        gabinete.inicio_licenca = inicio
        gabinete.fim_licenca = base + timedelta(days=dias)
        gabinete.save(update_fields=["status_licenca", "inicio_licenca", "fim_licenca", "atualizado_em"])
        write_audit_log(request, AuditLog.Action.UPDATE, gabinete, before=before, after=snapshot(gabinete))
        return Response(self.get_serializer(gabinete).data)

    @action(detail=True, methods=["post"], url_path="teste")
    def ativar_teste(self, request, pk=None):
        gabinete = self.get_object()
        before = snapshot(gabinete)
        dias = int(request.data.get("dias") or 7)
        gabinete.status_licenca = Gabinete.StatusLicenca.TESTE
        gabinete.inicio_licenca = timezone.localdate()
        gabinete.fim_licenca = timezone.localdate() + timedelta(days=dias)
        gabinete.save(update_fields=["status_licenca", "inicio_licenca", "fim_licenca", "atualizado_em"])
        write_audit_log(request, AuditLog.Action.UPDATE, gabinete, before=before, after=snapshot(gabinete))
        return Response(self.get_serializer(gabinete).data)

    @action(detail=True, methods=["post"], url_path="suspender")
    def suspender(self, request, pk=None):
        gabinete = self.get_object()
        before = snapshot(gabinete)
        gabinete.status_licenca = Gabinete.StatusLicenca.SUSPENSA
        gabinete.save(update_fields=["status_licenca", "atualizado_em"])
        write_audit_log(request, AuditLog.Action.UPDATE, gabinete, before=before, after=snapshot(gabinete))
        return Response(self.get_serializer(gabinete).data)


class CobrancaViewSet(AuditModelViewSetMixin, ModelViewSet):
    serializer_class = CobrancaSerializer
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    search_fields = ["gabinete__nome", "referencia", "status", "metodo_pagamento"]
    ordering_fields = ["vencimento", "valor", "status", "criado_em"]

    def get_queryset(self):
        queryset = Cobranca.objects.select_related("gabinete").all()
        gabinete = self.request.GET.get("gabinete")
        status_cobranca = self.request.GET.get("status")
        if gabinete:
            queryset = queryset.filter(gabinete_id=gabinete)
        if status_cobranca:
            queryset = queryset.filter(status=status_cobranca)
        return queryset

    @action(detail=True, methods=["post"], url_path="gerar-pagamento")
    def gerar_pagamento(self, request, pk=None):
        cobranca = self.get_object()
        try:
            payment_data = create_checkout_preference(cobranca)
        except MercadoPagoError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(cobranca)
        return Response({**serializer.data, "pagamento": payment_data})

    @action(detail=True, methods=["post"], url_path="marcar-paga")
    def marcar_paga(self, request, pk=None):
        cobranca = self.get_object()
        before = snapshot(cobranca)
        if cobranca.status != Cobranca.Status.PAGA:
            mark_cobranca_as_paid(cobranca)
            cobranca.refresh_from_db()
            write_audit_log(request, AuditLog.Action.UPDATE, cobranca, before=before, after=snapshot(cobranca))
        return Response(self.get_serializer(cobranca).data)

    @action(detail=True, methods=["post"], url_path="cancelar")
    def cancelar(self, request, pk=None):
        cobranca = self.get_object()
        before = snapshot(cobranca)
        cobranca.status = Cobranca.Status.CANCELADA
        cobranca.save(update_fields=["status", "atualizado_em"])
        write_audit_log(request, AuditLog.Action.UPDATE, cobranca, before=before, after=snapshot(cobranca))
        return Response(self.get_serializer(cobranca).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsPlatformAdmin])
def saas_overview(request):
    today = timezone.localdate()
    gabinetes_com_usuarios = Gabinete.objects.annotate(usuarios_count=Count("usuarios", distinct=True))
    receita_paga = Cobranca.objects.filter(status=Cobranca.Status.PAGA).aggregate(total=Sum("valor"))["total"] or 0
    return Response({
        "total_gabinetes": Gabinete.objects.count(),
        "licencas_ativas": Gabinete.objects.filter(status_licenca__in=["ativa", "teste"]).count(),
        "licencas_suspensas": Gabinete.objects.filter(status_licenca__in=["suspensa", "expirada"]).count(),
        "licencas_vencendo_7_dias": Gabinete.objects.filter(fim_licenca__gte=today, fim_licenca__lte=today + timedelta(days=7)).count(),
        "licencas_expiradas": Gabinete.objects.filter(Q(status_licenca=Gabinete.StatusLicenca.EXPIRADA) | Q(fim_licenca__lt=today)).count(),
        "gabinetes_sem_usuarios": gabinetes_com_usuarios.filter(usuarios_count=0).count(),
        "gabinetes_acima_limite": gabinetes_com_usuarios.filter(usuarios_count__gt=F("limite_usuarios")).count(),
        "gabinetes_perto_limite": len([
            gabinete.id
            for gabinete in gabinetes_com_usuarios
            if gabinete.limite_usuarios and gabinete.usuarios_count >= max(1, int(gabinete.limite_usuarios * 0.8))
        ]),
        "usuarios": Usuario.objects.count(),
        "atendimentos": Atendimento.objects.count(),
        "encaminhamentos": Encaminhamento.objects.count(),
        "oficios": Oficio.objects.count(),
        "cobrancas_abertas": Cobranca.objects.filter(status__in=["aberta", "atrasada"]).count(),
        "cobrancas_atrasadas": Cobranca.objects.filter(status=Cobranca.Status.ATRASADA).count(),
        "receita_paga": receita_paga,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def minha_assinatura(request):
    gabinete = getattr(request.user, "gabinete", None)
    if not gabinete:
        return Response({"detail": "Usuário sem gabinete vinculado."}, status=status.HTTP_404_NOT_FOUND)

    cobrancas = Cobranca.objects.filter(gabinete=gabinete).order_by("-vencimento", "-criado_em")[:24]
    serializer = MinhaAssinaturaSerializer({"gabinete": gabinete, "cobrancas": cobrancas})
    return Response(serializer.data)


@api_view(["POST", "GET"])
@permission_classes([AllowAny])
def mercado_pago_webhook(request):
    if request.method == "POST" and not validate_webhook_signature(request):
        return Response({"detail": "Assinatura do Mercado Pago inválida."}, status=status.HTTP_401_UNAUTHORIZED)

    payload = request.data if isinstance(request.data, dict) else {}
    topic = request.query_params.get("topic") or request.query_params.get("type") or payload.get("type")
    payment_id = request.query_params.get("data.id") or request.query_params.get("id")

    data = payload.get("data") or {}
    if isinstance(data, dict):
        payment_id = payment_id or data.get("id")

    if topic not in {"payment", "payments"} or not payment_id:
        return Response({"received": True})

    try:
        payment_data = get_payment(payment_id)
        cobranca = apply_payment_update(payment_data)
    except MercadoPagoError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"received": True, "cobranca": cobranca.id if cobranca else None})


@api_view(["POST"])
@permission_classes([AllowAny])
def mercado_pago_retorno(request):
    payment_id = (
        request.data.get("payment_id")
        or request.data.get("collection_id")
        or request.data.get("id")
    )

    if not payment_id:
        return Response({"detail": "ID do pagamento não informado."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        payment_data = get_payment(payment_id)
        cobranca = apply_payment_update(payment_data)
    except MercadoPagoError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    gabinete = cobranca.gabinete if cobranca else None
    return Response({
        "received": True,
        "payment_status": payment_data.get("status"),
        "cobranca": cobranca.id if cobranca else None,
        "cobranca_status": cobranca.status if cobranca else None,
        "gabinete": gabinete.id if gabinete else None,
        "licenca_ativa": gabinete.licenca_ativa if gabinete else False,
        "fim_licenca": gabinete.fim_licenca if gabinete else None,
    })
