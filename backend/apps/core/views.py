from itertools import chain

from django.db.models.functions import TruncMonth
from django.utils.dateparse import parse_date
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.assinaturas.permissions import HasActiveLicense, is_platform_admin
from apps.atendimentos.models import Atendimento
from apps.encaminhamentos.models import Encaminhamento
from apps.oficios.models import Oficio
from apps.usuarios.models import Usuario


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


@api_view(["GET"])
@permission_classes([IsAuthenticated, HasActiveLicense])
def dashboard(request):
    atendimentos_qs = scoped(Atendimento.objects.all(), request)
    encaminhamentos_qs = scoped(Encaminhamento.objects.all(), request, "atendimento__gabinete")
    oficios_qs = scoped(Oficio.objects.all(), request, "encaminhamento__atendimento__gabinete")
    usuarios_qs = Usuario.objects.all() if is_platform_admin(request.user) else Usuario.objects.filter(gabinete=request.user.gabinete)

    atendimentos_qs = filter_period(atendimentos_qs, request, "data_atendimento")
    encaminhamentos_qs = filter_period(encaminhamentos_qs, request, "data")
    oficios_qs = filter_period(oficios_qs, request, "criado_em__date")

    recentes = atendimentos_qs.order_by("-criado_em")[:5]
    return Response({
        "total_atendimentos": atendimentos_qs.count(),
        "total_encaminhamentos": encaminhamentos_qs.count(),
        "total_oficios": oficios_qs.count(),
        "total_usuarios": usuarios_qs.count(),
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
def historico(request):
    search = (request.GET.get("search") or "").lower()
    atendimentos_qs = scoped(Atendimento.objects.all(), request)
    encaminhamentos_qs = scoped(Encaminhamento.objects.select_related("atendimento"), request, "atendimento__gabinete")
    oficios_qs = scoped(Oficio.objects.select_related("encaminhamento"), request, "encaminhamento__atendimento__gabinete")

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
