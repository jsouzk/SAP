from rest_framework import serializers

from .models import Encaminhamento


class EncaminhamentoSerializer(serializers.ModelSerializer):
    atendimento_nome = serializers.CharField(source="atendimento.nome", read_only=True)

    class Meta:
        model = Encaminhamento
        fields = [
            "id",
            "atendimento",
            "atendimento_nome",
            "vereador",
            "secretaria_destino",
            "responsavel",
            "descricao",
            "data",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = ["id", "atendimento_nome", "criado_em", "atualizado_em"]
