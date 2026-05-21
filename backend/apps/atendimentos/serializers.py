from rest_framework import serializers

from .models import Atendimento


class AtendimentoSerializer(serializers.ModelSerializer):
    pessoa_nome = serializers.CharField(source="pessoa.nome", read_only=True)

    class Meta:
        model = Atendimento
        fields = [
            "id",
            "gabinete",
            "pessoa",
            "pessoa_nome",
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
        read_only_fields = ["id", "pessoa_nome", "criado_por", "criado_em", "atualizado_em"]
