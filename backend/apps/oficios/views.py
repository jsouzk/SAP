from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from .models import Oficio
from .serializers import OficioSerializer


class OficioViewSet(ModelViewSet):
    serializer_class = OficioSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["numero", "conteudo", "encaminhamento__secretaria_destino", "encaminhamento__atendimento__nome"]
    ordering_fields = ["numero", "criado_em"]

    def get_queryset(self):
        return Oficio.objects.select_related("encaminhamento", "encaminhamento__atendimento").all()
