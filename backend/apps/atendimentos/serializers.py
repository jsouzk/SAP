from rest_framework import serializers

from .models import Atendimento


class AtendimentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Atendimento
        fields = [
            "id",
            "nome",
            "endereco",
            "telefone",
            "data_nascimento",
            "data_atendimento",
            "quem_atendeu",
            "local_trabalho",
            "assunto",
            "criado_por",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = ["id", "criado_por", "criado_em", "atualizado_em"]
