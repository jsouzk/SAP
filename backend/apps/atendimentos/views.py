import csv

from django.http import HttpResponse
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.assinaturas.permissions import HasActiveLicense, is_platform_admin
from apps.core.audit import AuditModelViewSetMixin, write_audit_log, snapshot
from apps.core.models import AuditLog

from .models import Atendimento
from .serializers import AtendimentoSerializer


class AtendimentoViewSet(AuditModelViewSetMixin, ModelViewSet):
    serializer_class = AtendimentoSerializer
    permission_classes = [IsAuthenticated, HasActiveLicense]
    search_fields = ["nome", "telefone", "assunto", "endereco", "quem_atendeu", "status", "responsavel_retorno", "proxima_acao"]
    ordering_fields = ["nome", "assunto", "status", "prazo_retorno", "criado_em"]

    def get_queryset(self):
        queryset = Atendimento.objects.filter(ativo=True).select_related("criado_por", "gabinete", "pessoa")
        if is_platform_admin(self.request.user):
            scoped_queryset = queryset
        else:
            scoped_queryset = queryset.filter(gabinete=self.request.user.gabinete)

        status = self.request.GET.get("status")
        responsavel = self.request.GET.get("responsavel_retorno")
        assunto = self.request.GET.get("assunto")
        bairro = self.request.GET.get("bairro")
        prazo_vencido = self.request.GET.get("prazo_vencido")
        data_inicio = self.request.GET.get("data_inicio")
        data_fim = self.request.GET.get("data_fim")

        if status:
            scoped_queryset = scoped_queryset.filter(status=status)
        if responsavel:
            scoped_queryset = scoped_queryset.filter(responsavel_retorno__icontains=responsavel)
        if assunto:
            scoped_queryset = scoped_queryset.filter(assunto__icontains=assunto)
        if bairro:
            scoped_queryset = scoped_queryset.filter(pessoa__bairro__icontains=bairro)
        if prazo_vencido == "true":
            from django.utils import timezone

            scoped_queryset = scoped_queryset.filter(prazo_retorno__lt=timezone.localdate()).exclude(status__in=["resolvido", "arquivado"])
        if data_inicio:
            scoped_queryset = scoped_queryset.filter(data_atendimento__gte=data_inicio)
        if data_fim:
            scoped_queryset = scoped_queryset.filter(data_atendimento__lte=data_fim)
        return scoped_queryset

    def perform_create(self, serializer):
        instance = serializer.save(criado_por=self.request.user, gabinete=self.request.user.gabinete)
        write_audit_log(self.request, AuditLog.Action.CREATE, instance, after=snapshot(instance))

    @action(detail=False, methods=["get"], url_path="exportar")
    def exportar(self, request):
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="atendimentos.csv"'
        response.write("\ufeff")
        writer = csv.writer(response, delimiter=";")
        writer.writerow(["nome", "telefone", "assunto", "status", "prazo_retorno", "responsavel_retorno", "data_atendimento"])
        for item in self.filter_queryset(self.get_queryset()):
            writer.writerow([item.nome, item.telefone, item.assunto, item.status, item.prazo_retorno or "", item.responsavel_retorno, item.data_atendimento])
        write_audit_log(request, AuditLog.Action.EXPORT, request.user, after={"filename": "atendimentos.csv"})
        return response
