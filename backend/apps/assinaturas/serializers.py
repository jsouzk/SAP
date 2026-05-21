from rest_framework import serializers

from apps.atendimentos.models import Atendimento
from apps.encaminhamentos.models import Encaminhamento
from apps.oficios.models import Oficio
from apps.usuarios.models import Usuario

from .models import Cobranca, Gabinete


class GabineteSerializer(serializers.ModelSerializer):
    usuarios_count = serializers.IntegerField(read_only=True)
    atendimentos_count = serializers.SerializerMethodField()
    encaminhamentos_count = serializers.SerializerMethodField()
    oficios_count = serializers.SerializerMethodField()
    licenca_ativa = serializers.BooleanField(read_only=True)

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
            "observacoes",
            "licenca_ativa",
            "usuarios_count",
            "atendimentos_count",
            "encaminhamentos_count",
            "oficios_count",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = ["id", "licenca_ativa", "criado_em", "atualizado_em"]

    def get_atendimentos_count(self, obj):
        return Atendimento.objects.filter(gabinete=obj).count()

    def get_encaminhamentos_count(self, obj):
        return Encaminhamento.objects.filter(atendimento__gabinete=obj).count()

    def get_oficios_count(self, obj):
        return Oficio.objects.filter(encaminhamento__atendimento__gabinete=obj).count()


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
