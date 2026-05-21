from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.assinaturas.permissions import HasActiveLicense, is_platform_admin

from .models import Encaminhamento
from .serializers import EncaminhamentoSerializer


class EncaminhamentoViewSet(ModelViewSet):
    serializer_class = EncaminhamentoSerializer
    permission_classes = [IsAuthenticated, HasActiveLicense]
    search_fields = ["atendimento__nome", "vereador", "secretaria_destino", "responsavel", "descricao"]
    ordering_fields = ["data", "criado_em", "secretaria_destino"]

    def get_queryset(self):
        queryset = Encaminhamento.objects.select_related("atendimento", "atendimento__gabinete").all()
        if is_platform_admin(self.request.user):
            return queryset
        return queryset.filter(atendimento__gabinete=self.request.user.gabinete)
