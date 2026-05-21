from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.assinaturas.permissions import HasActiveLicense, is_platform_admin

from .models import PessoaAtendida
from .serializers import PessoaAtendidaSerializer


class PessoaAtendidaViewSet(ModelViewSet):
    serializer_class = PessoaAtendidaSerializer
    permission_classes = [IsAuthenticated, HasActiveLicense]
    search_fields = ["nome", "cpf", "telefone", "email", "titulo_eleitor", "local_votacao", "bairro"]
    ordering_fields = ["nome", "criado_em"]

    def get_queryset(self):
        queryset = PessoaAtendida.objects.select_related("gabinete", "criado_por")
        if is_platform_admin(self.request.user):
            return queryset
        return queryset.filter(gabinete=self.request.user.gabinete)

    def perform_create(self, serializer):
        serializer.save(gabinete=self.request.user.gabinete, criado_por=self.request.user)
