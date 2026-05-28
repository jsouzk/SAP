from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework.viewsets import ModelViewSet

from apps.assinaturas.permissions import HasActiveLicense, is_platform_admin
from apps.core.audit import AuditModelViewSetMixin
from apps.encaminhamentos.models import Encaminhamento

from .models import Oficio
from .serializers import OficioSerializer


class OficioViewSet(AuditModelViewSetMixin, ModelViewSet):
    serializer_class = OficioSerializer
    permission_classes = [IsAuthenticated, HasActiveLicense]
    search_fields = ["numero", "conteudo", "encaminhamento__secretaria_destino", "encaminhamento__atendimento__nome"]
    ordering_fields = ["numero", "criado_em"]

    def get_queryset(self):
        queryset = Oficio.objects.filter(ativo=True).select_related("encaminhamento", "encaminhamento__atendimento", "encaminhamento__atendimento__gabinete")
        if is_platform_admin(self.request.user):
            return queryset
        return queryset.filter(encaminhamento__atendimento__gabinete=self.request.user.gabinete)

    @action(detail=False, methods=["post"], url_path="gerar-de-encaminhamento")
    def gerar_de_encaminhamento(self, request):
        encaminhamento_id = request.data.get("encaminhamento")
        encaminhamento = get_object_or_404(Encaminhamento.objects.select_related("atendimento", "atendimento__gabinete"), pk=encaminhamento_id)
        if not is_platform_admin(request.user) and encaminhamento.atendimento.gabinete_id != request.user.gabinete_id:
            return Response({"detail": "Encaminhamento não pertence ao seu gabinete."}, status=403)

        oficio, _ = Oficio.objects.get_or_create(encaminhamento=encaminhamento)
        return Response(self.get_serializer(oficio).data)
