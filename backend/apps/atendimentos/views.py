from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.assinaturas.permissions import HasActiveLicense, is_platform_admin

from .models import Atendimento
from .serializers import AtendimentoSerializer


class AtendimentoViewSet(ModelViewSet):
    serializer_class = AtendimentoSerializer
    permission_classes = [IsAuthenticated, HasActiveLicense]
    search_fields = ["nome", "telefone", "assunto", "endereco", "quem_atendeu"]
    ordering_fields = ["nome", "assunto", "criado_em"]

    def get_queryset(self):
        queryset = Atendimento.objects.select_related("criado_por", "gabinete", "pessoa").all()
        if is_platform_admin(self.request.user):
            return queryset
        return queryset.filter(gabinete=self.request.user.gabinete)

    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user, gabinete=self.request.user.gabinete)
