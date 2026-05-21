from django.conf import settings
from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.atendimentos.models import Atendimento
from apps.encaminhamentos.models import Encaminhamento
from apps.oficios.models import Oficio
from apps.usuarios.models import Usuario

from .models import Cobranca, Gabinete
from .mercado_pago import (
    MercadoPagoError,
    apply_payment_update,
    create_checkout_preference,
    get_payment,
    validate_webhook_signature,
)
from .permissions import IsPlatformAdmin
from .serializers import CobrancaSerializer, GabineteSerializer


class GabineteViewSet(ModelViewSet):
    serializer_class = GabineteSerializer
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    search_fields = ["nome", "vereador", "email_responsavel", "status_licenca"]
    ordering_fields = ["nome", "status_licenca", "fim_licenca", "criado_em"]

    def get_queryset(self):
        return Gabinete.objects.annotate(usuarios_count=Count("usuarios", distinct=True)).order_by("nome", "id")

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


class CobrancaViewSet(ModelViewSet):
    serializer_class = CobrancaSerializer
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    search_fields = ["gabinete__nome", "referencia", "status", "metodo_pagamento"]
    ordering_fields = ["vencimento", "valor", "status", "criado_em"]

    def get_queryset(self):
        return Cobranca.objects.select_related("gabinete").all()

    @action(detail=True, methods=["post"], url_path="gerar-pagamento")
    def gerar_pagamento(self, request, pk=None):
        cobranca = self.get_object()
        try:
            payment_data = create_checkout_preference(cobranca)
        except MercadoPagoError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(cobranca)
        return Response({**serializer.data, "pagamento": payment_data})


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsPlatformAdmin])
def saas_overview(request):
    receita_paga = Cobranca.objects.filter(status=Cobranca.Status.PAGA).aggregate(total=Sum("valor"))["total"] or 0
    return Response({
        "total_gabinetes": Gabinete.objects.count(),
        "licencas_ativas": Gabinete.objects.filter(status_licenca__in=["ativa", "teste"]).count(),
        "licencas_suspensas": Gabinete.objects.filter(status_licenca__in=["suspensa", "expirada"]).count(),
        "usuarios": Usuario.objects.count(),
        "atendimentos": Atendimento.objects.count(),
        "encaminhamentos": Encaminhamento.objects.count(),
        "oficios": Oficio.objects.count(),
        "cobrancas_abertas": Cobranca.objects.filter(status__in=["aberta", "atrasada"]).count(),
        "receita_paga": receita_paga,
    })


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
