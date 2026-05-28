import csv

from django.conf import settings
from django.http import HttpResponse
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.assinaturas.permissions import HasActiveLicense, is_platform_admin
from apps.core.audit import AuditModelViewSetMixin, write_audit_log, snapshot
from apps.core.models import AuditLog

from .models import PessoaAtendida
from .serializers import PessoaAtendidaSerializer


class PessoaAtendidaViewSet(AuditModelViewSetMixin, ModelViewSet):
    serializer_class = PessoaAtendidaSerializer
    permission_classes = [IsAuthenticated, HasActiveLicense]
    search_fields = ["nome", "cpf", "telefone", "email", "titulo_eleitor", "local_votacao", "bairro"]
    ordering_fields = ["nome", "criado_em"]

    def get_queryset(self):
        queryset = PessoaAtendida.objects.filter(ativo=True).select_related("gabinete", "criado_por").prefetch_related(
            "atendimentos",
            "atendimentos__encaminhamentos",
            "atendimentos__encaminhamentos__oficios",
        )
        if is_platform_admin(self.request.user):
            return queryset
        return queryset.filter(gabinete=self.request.user.gabinete)

    def perform_create(self, serializer):
        instance = serializer.save(gabinete=self.request.user.gabinete, criado_por=self.request.user)
        write_audit_log(self.request, AuditLog.Action.CREATE, instance, after=snapshot(instance))

    @action(detail=False, methods=["get"], url_path="exportar")
    def exportar(self, request):
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="pessoas.csv"'
        response.write("\ufeff")
        writer = csv.writer(response, delimiter=";")
        writer.writerow(["nome", "cpf", "telefone", "email", "data_nascimento", "local_trabalho", "bairro", "cidade", "titulo_eleitor"])
        for pessoa in self.filter_queryset(self.get_queryset()):
            writer.writerow([pessoa.nome, pessoa.cpf, pessoa.telefone, pessoa.email, pessoa.data_nascimento or "", pessoa.local_trabalho, pessoa.bairro, pessoa.cidade, pessoa.titulo_eleitor])
        return response

    @action(detail=False, methods=["post"], url_path="importar", parser_classes=[MultiPartParser])
    def importar(self, request):
        arquivo = request.FILES.get("arquivo")
        if not arquivo:
            return Response({"detail": "Envie um arquivo CSV no campo arquivo."}, status=400)
        if arquivo.size > getattr(settings, "IMPORTACAO_MAX_UPLOAD_SIZE", 2 * 1024 * 1024):
            return Response({"detail": "Arquivo acima do tamanho maximo permitido."}, status=400)
        if not arquivo.name.lower().endswith(".csv"):
            return Response({"detail": "Envie apenas arquivos CSV."}, status=400)

        try:
            linhas = arquivo.read().decode("utf-8-sig").splitlines()
        except UnicodeDecodeError:
            return Response({"detail": "Arquivo CSV invalido ou com codificacao nao suportada."}, status=400)

        reader = csv.DictReader(linhas, delimiter=";")
        criados = 0
        for row in reader:
            if criados >= getattr(settings, "IMPORTACAO_MAX_LINHAS", 1000):
                return Response({"detail": "Limite de linhas da importacao excedido."}, status=400)
            serializer = self.get_serializer(data={
                "nome": row.get("nome", ""),
                "cpf": row.get("cpf", ""),
                "telefone": row.get("telefone", ""),
                "email": row.get("email", ""),
                "data_nascimento": row.get("data_nascimento", "") or None,
                "local_trabalho": row.get("local_trabalho", ""),
                "bairro": row.get("bairro", ""),
                "cidade": row.get("cidade", "Iranduba"),
                "titulo_eleitor": row.get("titulo_eleitor", ""),
            })
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            criados += 1
        return Response({"criados": criados})
