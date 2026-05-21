from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.assinaturas.permissions import HasActiveLicense, is_platform_admin

from .models import Oficio
from .serializers import OficioSerializer


class OficioViewSet(ModelViewSet):
    serializer_class = OficioSerializer
    permission_classes = [IsAuthenticated, HasActiveLicense]
    search_fields = ["numero", "conteudo", "encaminhamento__secretaria_destino", "encaminhamento__atendimento__nome"]
    ordering_fields = ["numero", "criado_em"]

    def get_queryset(self):
        queryset = Oficio.objects.select_related("encaminhamento", "encaminhamento__atendimento", "encaminhamento__atendimento__gabinete").all()
        if is_platform_admin(self.request.user):
            return queryset
        return queryset.filter(encaminhamento__atendimento__gabinete=self.request.user.gabinete)
