from itertools import chain

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.atendimentos.models import Atendimento
from apps.encaminhamentos.models import Encaminhamento
from apps.oficios.models import Oficio
from apps.usuarios.models import Usuario


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard(request):
    recentes = Atendimento.objects.order_by("-criado_em")[:5]
    return Response({
        "total_atendimentos": Atendimento.objects.count(),
        "total_encaminhamentos": Encaminhamento.objects.count(),
        "total_oficios": Oficio.objects.count(),
        "total_usuarios": Usuario.objects.count(),
        "recentes": [
            {"id": item.id, "nome": item.nome, "assunto": item.assunto, "criado_em": item.criado_em}
            for item in recentes
        ],
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def historico(request):
    search = (request.GET.get("search") or "").lower()
    atendimentos = [
        {"id": item.id, "tipo": "atendimento", "titulo": f"Atendimento de {item.nome}", "descricao": item.assunto, "data": item.criado_em}
        for item in Atendimento.objects.all()[:50]
    ]
    encaminhamentos = [
        {"id": item.id, "tipo": "encaminhamento", "titulo": f"Encaminhamento para {item.secretaria_destino}", "descricao": item.descricao, "data": item.criado_em}
        for item in Encaminhamento.objects.select_related("atendimento")[:50]
    ]
    oficios = [
        {"id": item.id, "tipo": "oficio", "titulo": f"Oficio {item.numero}", "descricao": item.conteudo[:160], "data": item.criado_em}
        for item in Oficio.objects.select_related("encaminhamento")[:50]
    ]
    events = sorted(chain(atendimentos, encaminhamentos, oficios), key=lambda item: item["data"], reverse=True)
    if search:
        events = [item for item in events if search in item["titulo"].lower() or search in item["descricao"].lower()]
    return Response({"count": len(events), "results": events[:100]})
