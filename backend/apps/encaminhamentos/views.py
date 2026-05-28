from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.assinaturas.permissions import HasActiveLicense, is_platform_admin
from apps.core.audit import AuditModelViewSetMixin, write_audit_log, snapshot
from apps.core.models import AuditLog

from .models import Encaminhamento
from .serializers import EncaminhamentoSerializer


class EncaminhamentoViewSet(AuditModelViewSetMixin, ModelViewSet):
    serializer_class = EncaminhamentoSerializer
    permission_classes = [IsAuthenticated, HasActiveLicense]
    search_fields = ["atendimento__nome", "vereador", "secretaria_destino", "responsavel", "descricao"]
    ordering_fields = ["data", "criado_em", "secretaria_destino"]

    def get_queryset(self):
        queryset = Encaminhamento.objects.filter(ativo=True).select_related("atendimento", "atendimento__gabinete")
        if is_platform_admin(self.request.user):
            return queryset
        return queryset.filter(atendimento__gabinete=self.request.user.gabinete)

    def perform_create(self, serializer):
        encaminhamento = serializer.save()
        write_audit_log(self.request, AuditLog.Action.CREATE, encaminhamento, after=snapshot(encaminhamento))
        encaminhamento.atendimento.status = "encaminhado"
        encaminhamento.atendimento.save(update_fields=["status", "atualizado_em"])
