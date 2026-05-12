from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from .models import Atendimento
from .serializers import AtendimentoSerializer


class AtendimentoViewSet(ModelViewSet):
    serializer_class = AtendimentoSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["nome", "telefone", "assunto", "endereco", "quem_atendeu"]
    ordering_fields = ["nome", "assunto", "criado_em"]

    def get_queryset(self):
        return Atendimento.objects.select_related("criado_por").all()

    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)
