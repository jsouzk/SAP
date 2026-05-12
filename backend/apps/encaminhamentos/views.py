from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from .models import Encaminhamento
from .serializers import EncaminhamentoSerializer


class EncaminhamentoViewSet(ModelViewSet):
    serializer_class = EncaminhamentoSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["atendimento__nome", "vereador", "secretaria_destino", "responsavel", "descricao"]
    ordering_fields = ["data", "criado_em", "secretaria_destino"]

    def get_queryset(self):
        return Encaminhamento.objects.select_related("atendimento").all()
