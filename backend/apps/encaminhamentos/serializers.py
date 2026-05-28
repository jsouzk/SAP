from rest_framework import serializers

from apps.assinaturas.permissions import is_platform_admin

from .models import Encaminhamento


class EncaminhamentoSerializer(serializers.ModelSerializer):
    atendimento_nome = serializers.CharField(source="atendimento.nome", read_only=True)
    atendimento_assunto = serializers.CharField(source="atendimento.assunto", read_only=True)
    atendimento_telefone = serializers.CharField(source="atendimento.telefone", read_only=True)

    class Meta:
        model = Encaminhamento
        fields = [
            "id",
            "atendimento",
            "atendimento_nome",
            "atendimento_assunto",
            "atendimento_telefone",
            "vereador",
            "secretaria_destino",
            "responsavel",
            "descricao",
            "data",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = ["id", "atendimento_nome", "atendimento_assunto", "atendimento_telefone", "criado_em", "atualizado_em"]

    def validate_atendimento(self, atendimento):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if is_platform_admin(user):
            return atendimento

        if atendimento.gabinete_id != getattr(user, "gabinete_id", None):
            raise serializers.ValidationError("Atendimento não pertence ao seu gabinete.")
        return atendimento
