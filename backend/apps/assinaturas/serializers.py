from datetime import timedelta

from rest_framework import serializers
from django.utils import timezone

from apps.atendimentos.models import Atendimento
from apps.core.models import AuditLog
from apps.encaminhamentos.models import Encaminhamento
from apps.oficios.models import Oficio
from apps.usuarios.models import Usuario
from apps.pessoas.models import PessoaAtendida

from .models import Cobranca, Gabinete


class GabineteSerializer(serializers.ModelSerializer):
    usuarios_count = serializers.IntegerField(read_only=True)
    atendimentos_count = serializers.SerializerMethodField()
    encaminhamentos_count = serializers.SerializerMethodField()
    oficios_count = serializers.SerializerMethodField()
    pessoas_count = serializers.SerializerMethodField()
    cobrancas_abertas_count = serializers.SerializerMethodField()
    cobrancas_atrasadas_count = serializers.SerializerMethodField()
    licenca_ativa = serializers.BooleanField(read_only=True)
    dias_restantes = serializers.SerializerMethodField()
    mensagem_licenca = serializers.SerializerMethodField()
    ultima_atividade = serializers.SerializerMethodField()
    risco_admin = serializers.SerializerMethodField()

    class Meta:
        model = Gabinete
        fields = [
            "id",
            "nome",
            "vereador",
            "email_responsavel",
            "telefone",
            "status_licenca",
            "inicio_licenca",
            "fim_licenca",
            "valor_mensal",
            "limite_usuarios",
            "logo_url",
            "assinatura_nome",
            "assinatura_cargo",
            "dias_prazo_padrao",
            "secretarias_padrao",
            "assuntos_padrao",
            "template_oficio",
            "observacoes",
            "licenca_ativa",
            "dias_restantes",
            "mensagem_licenca",
            "usuarios_count",
            "atendimentos_count",
            "encaminhamentos_count",
            "oficios_count",
            "pessoas_count",
            "cobrancas_abertas_count",
            "cobrancas_atrasadas_count",
            "ultima_atividade",
            "risco_admin",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = ["id", "licenca_ativa", "criado_em", "atualizado_em"]

    def get_dias_restantes(self, obj):
        if not obj.fim_licenca:
            return None
        return (obj.fim_licenca - timezone.localdate()).days

    def get_mensagem_licenca(self, obj):
        if obj.licenca_ativa:
            if obj.fim_licenca:
                dias = (obj.fim_licenca - timezone.localdate()).days
                return f"Licença ativa. Vence em {dias} dia(s), em {obj.fim_licenca:%d/%m/%Y}."
            return "Licença ativa sem data de vencimento."
        if obj.fim_licenca and obj.fim_licenca < timezone.localdate():
            return f"Licença vencida desde {obj.fim_licenca:%d/%m/%Y}."
        return f"Licença {obj.status_licenca}."

    def get_atendimentos_count(self, obj):
        return Atendimento.objects.filter(gabinete=obj).count()

    def get_encaminhamentos_count(self, obj):
        return Encaminhamento.objects.filter(atendimento__gabinete=obj).count()

    def get_oficios_count(self, obj):
        return Oficio.objects.filter(encaminhamento__atendimento__gabinete=obj).count()

    def get_pessoas_count(self, obj):
        return PessoaAtendida.objects.filter(gabinete=obj, ativo=True).count()

    def get_cobrancas_abertas_count(self, obj):
        return Cobranca.objects.filter(gabinete=obj, status__in=[Cobranca.Status.ABERTA, Cobranca.Status.ATRASADA]).count()

    def get_cobrancas_atrasadas_count(self, obj):
        return Cobranca.objects.filter(gabinete=obj, status=Cobranca.Status.ATRASADA).count()

    def get_ultima_atividade(self, obj):
        dates = [
            obj.atualizado_em,
            Usuario.objects.filter(gabinete=obj).order_by("-atualizado_em").values_list("atualizado_em", flat=True).first(),
            Atendimento.objects.filter(gabinete=obj).order_by("-atualizado_em").values_list("atualizado_em", flat=True).first(),
            Encaminhamento.objects.filter(atendimento__gabinete=obj).order_by("-atualizado_em").values_list("atualizado_em", flat=True).first(),
            Oficio.objects.filter(encaminhamento__atendimento__gabinete=obj).order_by("-atualizado_em").values_list("atualizado_em", flat=True).first(),
            Cobranca.objects.filter(gabinete=obj).order_by("-atualizado_em").values_list("atualizado_em", flat=True).first(),
            AuditLog.objects.filter(model_name="assinaturas.Gabinete", object_id=str(obj.pk)).order_by("-criado_em").values_list("criado_em", flat=True).first(),
        ]
        valid_dates = [date for date in dates if date]
        return max(valid_dates) if valid_dates else None

    def get_risco_admin(self, obj):
        risks = []
        today = timezone.localdate()
        usuarios_count = getattr(obj, "usuarios_count", None)
        if usuarios_count is None:
            usuarios_count = Usuario.objects.filter(gabinete=obj).count()

        if obj.status_licenca == Gabinete.StatusLicenca.EXPIRADA or (obj.fim_licenca and obj.fim_licenca < today):
            risks.append("expirada")
        elif obj.fim_licenca and obj.fim_licenca <= today + timedelta(days=7):
            risks.append("vencendo")
        if usuarios_count == 0:
            risks.append("sem_usuarios")
        if usuarios_count > obj.limite_usuarios:
            risks.append("acima_limite")
        elif obj.limite_usuarios and usuarios_count >= max(1, int(obj.limite_usuarios * 0.8)):
            risks.append("perto_limite")
        if self.get_cobrancas_atrasadas_count(obj):
            risks.append("cobranca_atrasada")
        return risks


class SaaSOverviewSerializer(serializers.Serializer):
    total_gabinetes = serializers.IntegerField()
    licencas_ativas = serializers.IntegerField()
    licencas_suspensas = serializers.IntegerField()
    usuarios = serializers.IntegerField()
    atendimentos = serializers.IntegerField()
    encaminhamentos = serializers.IntegerField()
    oficios = serializers.IntegerField()


class CobrancaSerializer(serializers.ModelSerializer):
    gabinete_nome = serializers.CharField(source="gabinete.nome", read_only=True)

    class Meta:
        model = Cobranca
        fields = [
            "id",
            "gabinete",
            "gabinete_nome",
            "referencia",
            "valor",
            "vencimento",
            "pago_em",
            "status",
            "metodo_pagamento",
            "codigo_pagamento",
            "gateway",
            "gateway_payment_id",
            "observacoes",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = ["id", "gabinete_nome", "criado_em", "atualizado_em"]


class MinhaAssinaturaSerializer(serializers.Serializer):
    gabinete = GabineteSerializer()
    cobrancas = CobrancaSerializer(many=True)
