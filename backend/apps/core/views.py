from itertools import chain
import csv
import io
import zipfile
from datetime import timedelta

from django.http import HttpResponse
from django.db.models import Count
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from apps.assinaturas.permissions import HasActiveLicense, IsGabineteAdminOrPlatform, is_platform_admin
from apps.assinaturas.models import Gabinete
from apps.atendimentos.models import Atendimento
from apps.encaminhamentos.models import Encaminhamento
from apps.oficios.models import Oficio
from apps.pessoas.models import PessoaAtendida
from apps.assinaturas.models import Cobranca
from apps.usuarios.models import Usuario
from .models import Anexo, AuditLog, Comentario
from .serializers import AnexoSerializer, AuditLogSerializer, ComentarioSerializer


def scoped(queryset, request, field="gabinete"):
    if is_platform_admin(request.user):
        return queryset
    gabinete = request.user.gabinete
    if field == "gabinete":
        return queryset.filter(gabinete=gabinete)
    return queryset.filter(**{field: gabinete})


def filter_period(queryset, request, field):
    data_inicio = parse_date(request.GET.get("data_inicio") or "")
    data_fim = parse_date(request.GET.get("data_fim") or "")

    if data_inicio:
        queryset = queryset.filter(**{f"{field}__gte": data_inicio})
    if data_fim:
        queryset = queryset.filter(**{f"{field}__lte": data_fim})
    return queryset


def resolve_entity_gabinete(tipo_entidade, objeto_id):
    entity_queries = {
        Comentario.TipoEntidade.PESSOA: lambda pk: PessoaAtendida.objects.select_related("gabinete").filter(pk=pk).first(),
        Comentario.TipoEntidade.ATENDIMENTO: lambda pk: Atendimento.objects.select_related("gabinete").filter(pk=pk).first(),
        Comentario.TipoEntidade.ENCAMINHAMENTO: lambda pk: Encaminhamento.objects.select_related("atendimento__gabinete").filter(pk=pk).first(),
        Comentario.TipoEntidade.OFICIO: lambda pk: Oficio.objects.select_related("encaminhamento__atendimento__gabinete").filter(pk=pk).first(),
    }

    entity = entity_queries.get(tipo_entidade, lambda pk: None)(objeto_id)
    if not entity:
        raise ValidationError({"objeto_id": "Objeto vinculado nao encontrado."})

    if tipo_entidade in {Comentario.TipoEntidade.PESSOA, Comentario.TipoEntidade.ATENDIMENTO}:
        gabinete = entity.gabinete
    elif tipo_entidade == Comentario.TipoEntidade.ENCAMINHAMENTO:
        gabinete = entity.atendimento.gabinete
    else:
        gabinete = entity.encaminhamento.atendimento.gabinete

    if not gabinete:
        raise ValidationError({"objeto_id": "Objeto vinculado nao possui gabinete."})
    return gabinete


def activity_gabinete_for_create(request, serializer):
    gabinete = resolve_entity_gabinete(
        serializer.validated_data.get("tipo_entidade"),
        serializer.validated_data.get("objeto_id"),
    )

    if not is_platform_admin(request.user) and gabinete != request.user.gabinete:
        raise ValidationError({"objeto_id": "Objeto vinculado nao encontrado."})
    return gabinete


def monthly_series(atendimentos_qs, encaminhamentos_qs, oficios_qs):
    buckets = {}

    for item in atendimentos_qs.annotate(mes=TruncMonth("data_atendimento")).values("mes"):
        if item["mes"]:
            key = item["mes"].strftime("%Y-%m")
            buckets.setdefault(key, {"mes": key, "atendimentos": 0, "encaminhamentos": 0, "oficios": 0})
            buckets[key]["atendimentos"] += 1

    for item in encaminhamentos_qs.annotate(mes=TruncMonth("data")).values("mes"):
        if item["mes"]:
            key = item["mes"].strftime("%Y-%m")
            buckets.setdefault(key, {"mes": key, "atendimentos": 0, "encaminhamentos": 0, "oficios": 0})
            buckets[key]["encaminhamentos"] += 1

    for item in oficios_qs.annotate(mes=TruncMonth("criado_em")).values("mes"):
        if item["mes"]:
            key = item["mes"].strftime("%Y-%m")
            buckets.setdefault(key, {"mes": key, "atendimentos": 0, "encaminhamentos": 0, "oficios": 0})
            buckets[key]["oficios"] += 1

    series = []
    for item in sorted(buckets.values(), key=lambda value: value["mes"]):
        item["total"] = item["atendimentos"] + item["encaminhamentos"] + item["oficios"]
        series.append(item)
    return series[-8:]


def pendencias_payload(request):
    hoje = timezone.localdate()
    atendimentos_qs = scoped(Atendimento.objects.filter(ativo=True).select_related("pessoa", "criado_por"), request)
    encaminhamentos_qs = scoped(
        Encaminhamento.objects.filter(ativo=True).select_related("atendimento").prefetch_related("oficios"),
        request,
        "atendimento__gabinete",
    )

    atrasados = atendimentos_qs.filter(prazo_retorno__lt=hoje).exclude(status__in=["resolvido", "arquivado"])
    vencendo_hoje = atendimentos_qs.filter(prazo_retorno=hoje).exclude(status__in=["resolvido", "arquivado"])
    vencendo_3_dias = atendimentos_qs.filter(prazo_retorno__gt=hoje, prazo_retorno__lte=hoje + timedelta(days=3)).exclude(status__in=["resolvido", "arquivado"])
    sem_responsavel = atendimentos_qs.filter(responsavel_retorno="").exclude(status__in=["resolvido", "arquivado"])
    encaminhados_sem_oficio = encaminhamentos_qs.filter(oficios__isnull=True)
    antigos_em_andamento = atendimentos_qs.filter(status="em_andamento", data_atendimento__lt=hoje - timedelta(days=7))

    def atendimento_item(item, tipo):
        return {
            "id": item.id,
            "tipo": tipo,
            "titulo": item.nome,
            "descricao": item.assunto,
            "status": item.status,
            "prazo_retorno": item.prazo_retorno,
            "responsavel": item.responsavel_retorno or item.quem_atendeu,
            "data": item.data_atendimento,
        }

    def encaminhamento_item(item):
        return {
            "id": item.id,
            "tipo": "encaminhamento_sem_oficio",
            "titulo": item.secretaria_destino,
            "descricao": item.descricao,
            "status": "",
            "prazo_retorno": None,
            "responsavel": item.responsavel,
            "data": item.data,
        }

    results = (
        [atendimento_item(item, "prazo_vencido") for item in atrasados[:50]]
        + [atendimento_item(item, "vence_hoje") for item in vencendo_hoje[:50]]
        + [atendimento_item(item, "vence_3_dias") for item in vencendo_3_dias[:50]]
        + [atendimento_item(item, "sem_responsavel") for item in sem_responsavel[:50]]
        + [encaminhamento_item(item) for item in encaminhados_sem_oficio[:50]]
        + [atendimento_item(item, "em_andamento_antigo") for item in antigos_em_andamento[:50]]
    )
    results = sorted(results, key=lambda item: str(item["data"] or ""), reverse=True)
    resumo = {
        "prazo_vencido": atrasados.count(),
        "vence_hoje": vencendo_hoje.count(),
        "vence_3_dias": vencendo_3_dias.count(),
        "sem_responsavel": sem_responsavel.count(),
        "encaminhamento_sem_oficio": encaminhados_sem_oficio.count(),
        "em_andamento_antigo": antigos_em_andamento.count(),
    }
    return {"count": len(results), "resumo": resumo, "results": results[:100]}


@api_view(["GET"])
@permission_classes([IsAuthenticated, HasActiveLicense])
def dashboard(request):
    atendimentos_qs = scoped(Atendimento.objects.filter(ativo=True), request)
    encaminhamentos_qs = scoped(Encaminhamento.objects.filter(ativo=True), request, "atendimento__gabinete")
    oficios_qs = scoped(Oficio.objects.filter(ativo=True), request, "encaminhamento__atendimento__gabinete")
    usuarios_qs = Usuario.objects.all() if is_platform_admin(request.user) else Usuario.objects.filter(gabinete=request.user.gabinete)

    atendimentos_qs = filter_period(atendimentos_qs, request, "data_atendimento")
    encaminhamentos_qs = filter_period(encaminhamentos_qs, request, "data")
    oficios_qs = filter_period(oficios_qs, request, "criado_em__date")

    recentes = atendimentos_qs.order_by("-criado_em")[:5]
    status_counts = {
        item["status"]: item["total"]
        for item in atendimentos_qs.values("status").annotate(total=Count("id"))
    }
    bairros = list(
        atendimentos_qs.exclude(pessoa__bairro="")
        .values("pessoa__bairro")
        .annotate(total=Count("id"))
        .order_by("-total")[:8]
    )
    assuntos = list(atendimentos_qs.values("assunto").annotate(total=Count("id")).order_by("-total")[:8])
    secretarias = list(encaminhamentos_qs.values("secretaria_destino").annotate(total=Count("id")).order_by("-total")[:8])
    produtividade = list(
        atendimentos_qs.exclude(criado_por__isnull=True)
        .values("criado_por__nome")
        .annotate(total=Count("id"))
        .order_by("-total")[:8]
    )
    pendencias_data = pendencias_payload(request)
    return Response({
        "total_atendimentos": atendimentos_qs.count(),
        "total_encaminhamentos": encaminhamentos_qs.count(),
        "total_oficios": oficios_qs.count(),
        "total_usuarios": usuarios_qs.count(),
        "atendimentos_por_status": status_counts,
        "atendimentos_pendentes": pendencias_data["count"],
        "ranking_bairros": [{"label": item["pessoa__bairro"], "total": item["total"]} for item in bairros],
        "ranking_assuntos": [{"label": item["assunto"], "total": item["total"]} for item in assuntos],
        "ranking_secretarias": [{"label": item["secretaria_destino"], "total": item["total"]} for item in secretarias],
        "produtividade_usuarios": [{"label": item["criado_por__nome"], "total": item["total"]} for item in produtividade],
        "filtros": {
            "data_inicio": request.GET.get("data_inicio") or "",
            "data_fim": request.GET.get("data_fim") or "",
        },
        "serie_mensal": monthly_series(atendimentos_qs, encaminhamentos_qs, oficios_qs),
        "recentes": [
            {"id": item.id, "nome": item.nome, "assunto": item.assunto, "criado_em": item.criado_em}
            for item in recentes
        ],
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated, HasActiveLicense])
def relatorios(request):
    atendimentos_qs = scoped(Atendimento.objects.filter(ativo=True), request)
    encaminhamentos_qs = scoped(Encaminhamento.objects.filter(ativo=True), request, "atendimento__gabinete")
    oficios_qs = scoped(Oficio.objects.filter(ativo=True), request, "encaminhamento__atendimento__gabinete")

    atendimentos_qs = filter_period(atendimentos_qs, request, "data_atendimento")
    encaminhamentos_qs = filter_period(encaminhamentos_qs, request, "data")
    oficios_qs = filter_period(oficios_qs, request, "criado_em__date")

    por_bairro = list(
        atendimentos_qs.exclude(pessoa__bairro="")
        .values("pessoa__bairro")
        .annotate(total=Count("id"))
        .order_by("-total")[:20]
    )
    por_assunto = list(atendimentos_qs.values("assunto").annotate(total=Count("id")).order_by("-total")[:20])
    por_usuario = list(
        atendimentos_qs.exclude(criado_por__isnull=True)
        .values("criado_por__nome")
        .annotate(total=Count("id"))
        .order_by("-total")[:20]
    )
    por_secretaria = list(encaminhamentos_qs.values("secretaria_destino").annotate(total=Count("id")).order_by("-total")[:20])

    return Response({
        "totais": {
            "atendimentos": atendimentos_qs.count(),
            "encaminhamentos": encaminhamentos_qs.count(),
            "oficios": oficios_qs.count(),
        },
        "por_bairro": [{"label": item["pessoa__bairro"], "total": item["total"]} for item in por_bairro],
        "por_assunto": [{"label": item["assunto"], "total": item["total"]} for item in por_assunto],
        "por_usuario": [{"label": item["criado_por__nome"], "total": item["total"]} for item in por_usuario],
        "por_secretaria": [{"label": item["secretaria_destino"], "total": item["total"]} for item in por_secretaria],
        "serie_mensal": monthly_series(atendimentos_qs, encaminhamentos_qs, oficios_qs),
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated, HasActiveLicense])
def notificacoes(request):
    hoje = timezone.localdate()
    atendimentos_qs = scoped(Atendimento.objects.filter(ativo=True), request)
    encaminhamentos_qs = scoped(Encaminhamento.objects.filter(ativo=True), request, "atendimento__gabinete")

    vencidos = atendimentos_qs.filter(prazo_retorno__lt=hoje).exclude(status__in=["resolvido", "arquivado"]).count()
    vencem_hoje = atendimentos_qs.filter(prazo_retorno=hoje).exclude(status__in=["resolvido", "arquivado"]).count()
    sem_responsavel = atendimentos_qs.filter(responsavel_retorno="").exclude(status__in=["resolvido", "arquivado"]).count()
    sem_oficio = encaminhamentos_qs.filter(oficios__isnull=True).count()

    items = []
    if vencidos:
        items.append({"tipo": "prazo_vencido", "titulo": "Atendimentos vencidos", "descricao": f"{vencidos} atendimento(s) com prazo vencido.", "url": "/pendencias"})
    if vencem_hoje:
        items.append({"tipo": "vence_hoje", "titulo": "Prazos de hoje", "descricao": f"{vencem_hoje} atendimento(s) vencem hoje.", "url": "/pendencias"})
    if sem_responsavel:
        items.append({"tipo": "sem_responsavel", "titulo": "Sem responsável", "descricao": f"{sem_responsavel} atendimento(s) sem responsável.", "url": "/pendencias"})
    if sem_oficio:
        items.append({"tipo": "sem_oficio", "titulo": "Encaminhamentos sem ofício", "descricao": f"{sem_oficio} encaminhamento(s) ainda sem ofício.", "url": "/pendencias"})

    gabinete = getattr(request.user, "gabinete", None)
    if gabinete and gabinete.fim_licenca:
        dias = (gabinete.fim_licenca - hoje).days
        if dias <= 5:
            items.append({"tipo": "licenca", "titulo": "Licença do gabinete", "descricao": gabinete.licenca_ativa and f"Licença vence em {dias} dia(s)." or "Licença vencida ou inativa.", "url": "/minha-assinatura"})

    return Response({"count": len(items), "items": items})


@api_view(["GET"])
@permission_classes([IsAuthenticated, HasActiveLicense])
def historico(request):
    search = (request.GET.get("search") or "").lower()
    atendimentos_qs = scoped(Atendimento.objects.filter(ativo=True), request)
    encaminhamentos_qs = scoped(Encaminhamento.objects.filter(ativo=True).select_related("atendimento"), request, "atendimento__gabinete")
    oficios_qs = scoped(Oficio.objects.filter(ativo=True).select_related("encaminhamento"), request, "encaminhamento__atendimento__gabinete")

    atendimentos = [
        {"id": item.id, "tipo": "atendimento", "titulo": f"Atendimento de {item.nome}", "descricao": item.assunto, "data": item.criado_em}
        for item in atendimentos_qs[:50]
    ]
    encaminhamentos = [
        {"id": item.id, "tipo": "encaminhamento", "titulo": f"Encaminhamento para {item.secretaria_destino}", "descricao": item.descricao, "data": item.criado_em}
        for item in encaminhamentos_qs[:50]
    ]
    oficios = [
        {"id": item.id, "tipo": "oficio", "titulo": f"Oficio {item.numero}", "descricao": item.conteudo[:160], "data": item.criado_em}
        for item in oficios_qs[:50]
    ]
    events = sorted(chain(atendimentos, encaminhamentos, oficios), key=lambda item: item["data"], reverse=True)
    if search:
        events = [item for item in events if search in item["titulo"].lower() or search in item["descricao"].lower()]
    return Response({"count": len(events), "results": events[:100]})


@api_view(["GET"])
@permission_classes([IsAuthenticated, HasActiveLicense])
def pendencias(request):
    return Response(pendencias_payload(request))


@api_view(["GET"])
@permission_classes([IsAuthenticated, HasActiveLicense])
def busca_global(request):
    termo = (request.GET.get("q") or "").strip()
    if len(termo) < 2:
        return Response({"results": []})

    pessoas_qs = scoped(PessoaAtendida.objects.filter(ativo=True), request).filter(
        nome__icontains=termo
    ) | scoped(PessoaAtendida.objects.filter(ativo=True), request).filter(
        cpf__icontains=termo
    ) | scoped(PessoaAtendida.objects.filter(ativo=True), request).filter(
        telefone__icontains=termo
    )
    atendimentos_qs = scoped(Atendimento.objects.filter(ativo=True), request).filter(
        nome__icontains=termo
    ) | scoped(Atendimento.objects.filter(ativo=True), request).filter(
        telefone__icontains=termo
    ) | scoped(Atendimento.objects.filter(ativo=True), request).filter(
        assunto__icontains=termo
    )

    results = [
        {"tipo": "pessoa", "id": item.id, "titulo": item.nome, "descricao": item.cpf or item.telefone or item.bairro, "url": "/pessoas"}
        for item in pessoas_qs.distinct()[:8]
    ] + [
        {"tipo": "atendimento", "id": item.id, "titulo": item.nome, "descricao": item.assunto, "url": "/atendimentos"}
        for item in atendimentos_qs.distinct()[:8]
    ]
    return Response({"results": results[:12]})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def expirar_licencas(request):
    if not is_platform_admin(request.user):
        return Response({"detail": "Apenas administradores da plataforma podem executar esta ação."}, status=403)

    updated = Gabinete.objects.filter(
        status_licenca__in=[Gabinete.StatusLicenca.ATIVA, Gabinete.StatusLicenca.TESTE],
        fim_licenca__lt=timezone.localdate(),
    ).update(status_licenca=Gabinete.StatusLicenca.EXPIRADA)
    return Response({"expiradas": updated})


@api_view(["GET"])
@permission_classes([IsAuthenticated, HasActiveLicense])
def exportacao_gabinete(request):
    gabinete = getattr(request.user, "gabinete", None)
    if not gabinete and not is_platform_admin(request.user):
        return Response({"detail": "Usuário sem gabinete vinculado."}, status=404)

    def rows_to_csv(headers, rows):
        output = io.StringIO()
        writer = csv.writer(output, delimiter=";")
        writer.writerow(headers)
        writer.writerows(rows)
        return "\ufeff" + output.getvalue()

    if is_platform_admin(request.user):
        pessoas = PessoaAtendida.objects.filter(ativo=True)
        atendimentos = Atendimento.objects.filter(ativo=True)
        encaminhamentos = Encaminhamento.objects.filter(ativo=True)
        oficios = Oficio.objects.filter(ativo=True)
        cobrancas = Cobranca.objects.select_related("gabinete")
        filename = "exportacao-plataforma.zip"
    else:
        pessoas = PessoaAtendida.objects.filter(ativo=True, gabinete=gabinete)
        atendimentos = Atendimento.objects.filter(ativo=True, gabinete=gabinete)
        encaminhamentos = Encaminhamento.objects.filter(ativo=True, atendimento__gabinete=gabinete)
        oficios = Oficio.objects.filter(ativo=True, encaminhamento__atendimento__gabinete=gabinete)
        cobrancas = Cobranca.objects.filter(gabinete=gabinete)
        filename = f"exportacao-gabinete-{gabinete.id}.zip"

    files = {
        "pessoas.csv": rows_to_csv(
            ["nome", "cpf", "telefone", "email", "data_nascimento", "local_trabalho", "bairro", "cidade"],
            pessoas.values_list("nome", "cpf", "telefone", "email", "data_nascimento", "local_trabalho", "bairro", "cidade"),
        ),
        "atendimentos.csv": rows_to_csv(
            ["nome", "telefone", "assunto", "status", "prazo_retorno", "responsavel_retorno", "data_atendimento"],
            atendimentos.values_list("nome", "telefone", "assunto", "status", "prazo_retorno", "responsavel_retorno", "data_atendimento"),
        ),
        "encaminhamentos.csv": rows_to_csv(
            ["atendimento", "vereador", "secretaria_destino", "responsavel", "data"],
            encaminhamentos.values_list("atendimento__nome", "vereador", "secretaria_destino", "responsavel", "data"),
        ),
        "oficios.csv": rows_to_csv(
            ["numero", "atendimento", "secretaria", "criado_em"],
            oficios.values_list("numero", "encaminhamento__atendimento__nome", "encaminhamento__secretaria_destino", "criado_em"),
        ),
        "cobrancas.csv": rows_to_csv(
            ["gabinete", "referencia", "valor", "vencimento", "status", "gateway"],
            cobrancas.values_list("gabinete__nome", "referencia", "valor", "vencimento", "status", "gateway"),
        ),
    }

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, content in files.items():
            archive.writestr(name, content)

    response = HttpResponse(buffer.getvalue(), content_type="application/zip")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


class AuditLogViewSet(ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, HasActiveLicense, IsGabineteAdminOrPlatform]
    search_fields = ["model_name", "object_repr", "object_id", "user__nome", "user__email", "ip_address"]
    ordering_fields = ["criado_em", "action", "model_name"]

    def get_queryset(self):
        queryset = AuditLog.objects.select_related("user").all()
        if not is_platform_admin(self.request.user):
            queryset = queryset.filter(user__gabinete=self.request.user.gabinete)
        action = self.request.GET.get("action")
        model_name = self.request.GET.get("model_name")
        object_id = self.request.GET.get("object_id")
        user = self.request.GET.get("user")
        data_inicio = parse_date(self.request.GET.get("data_inicio") or "")
        data_fim = parse_date(self.request.GET.get("data_fim") or "")
        if action:
            queryset = queryset.filter(action=action)
        if model_name:
            queryset = queryset.filter(model_name__icontains=model_name)
        if object_id:
            queryset = queryset.filter(object_id=str(object_id))
        if user:
            queryset = queryset.filter(user_id=user)
        if data_inicio:
            queryset = queryset.filter(criado_em__date__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(criado_em__date__lte=data_fim)
        return queryset


class ComentarioViewSet(ModelViewSet):
    serializer_class = ComentarioSerializer
    permission_classes = [IsAuthenticated, HasActiveLicense]
    search_fields = ["texto", "tipo_entidade"]
    ordering_fields = ["criado_em"]

    def get_queryset(self):
        queryset = Comentario.objects.select_related("gabinete", "criado_por")
        if not is_platform_admin(self.request.user):
            queryset = queryset.filter(gabinete=self.request.user.gabinete)
        tipo = self.request.GET.get("tipo_entidade")
        objeto_id = self.request.GET.get("objeto_id")
        if tipo:
            queryset = queryset.filter(tipo_entidade=tipo)
        if objeto_id:
            queryset = queryset.filter(objeto_id=objeto_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(gabinete=activity_gabinete_for_create(self.request, serializer), criado_por=self.request.user)


class AnexoViewSet(ModelViewSet):
    serializer_class = AnexoSerializer
    permission_classes = [IsAuthenticated, HasActiveLicense]
    parser_classes = [MultiPartParser]
    search_fields = ["nome_original", "descricao", "tipo_entidade"]
    ordering_fields = ["criado_em"]

    def get_queryset(self):
        queryset = Anexo.objects.select_related("gabinete", "enviado_por")
        if not is_platform_admin(self.request.user):
            queryset = queryset.filter(gabinete=self.request.user.gabinete)
        tipo = self.request.GET.get("tipo_entidade")
        objeto_id = self.request.GET.get("objeto_id")
        if tipo:
            queryset = queryset.filter(tipo_entidade=tipo)
        if objeto_id:
            queryset = queryset.filter(objeto_id=objeto_id)
        return queryset

    def perform_create(self, serializer):
        arquivo = self.request.FILES.get("arquivo")
        serializer.save(
            gabinete=activity_gabinete_for_create(self.request, serializer),
            enviado_por=self.request.user,
            nome_original=getattr(arquivo, "name", ""),
        )
