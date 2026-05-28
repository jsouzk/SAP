from rest_framework import serializers

from apps.assinaturas.permissions import is_platform_admin

from .models import Oficio


class OficioSerializer(serializers.ModelSerializer):
    encaminhamento_resumo = serializers.SerializerMethodField()
    vereador = serializers.CharField(source="encaminhamento.vereador", read_only=True)
    secretaria_destino = serializers.CharField(source="encaminhamento.secretaria_destino", read_only=True)
    responsavel = serializers.CharField(source="encaminhamento.responsavel", read_only=True)
    descricao_encaminhamento = serializers.CharField(source="encaminhamento.descricao", read_only=True)
    atendimento_nome = serializers.CharField(source="encaminhamento.atendimento.nome", read_only=True)
    atendimento_assunto = serializers.CharField(source="encaminhamento.atendimento.assunto", read_only=True)

    class Meta:
        model = Oficio
        fields = [
            "id",
            "encaminhamento",
            "encaminhamento_resumo",
            "numero",
            "conteudo",
            "vereador",
            "secretaria_destino",
            "responsavel",
            "descricao_encaminhamento",
            "atendimento_nome",
            "atendimento_assunto",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = [
            "id",
            "numero",
            "encaminhamento_resumo",
            "vereador",
            "secretaria_destino",
            "responsavel",
            "descricao_encaminhamento",
            "atendimento_nome",
            "atendimento_assunto",
            "criado_em",
            "atualizado_em",
        ]

    def get_encaminhamento_resumo(self, obj):
        return f"{obj.encaminhamento.secretaria_destino} - {obj.encaminhamento.atendimento.nome}"

    def validate_encaminhamento(self, encaminhamento):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if is_platform_admin(user):
            return encaminhamento

        gabinete_id = encaminhamento.atendimento.gabinete_id
        if gabinete_id != getattr(user, "gabinete_id", None):
            raise serializers.ValidationError("Encaminhamento não pertence ao seu gabinete.")
        return encaminhamento
