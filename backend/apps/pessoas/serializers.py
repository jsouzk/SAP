from rest_framework import serializers

from .models import PessoaAtendida


class PessoaAtendidaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PessoaAtendida
        fields = [
            "id",
            "gabinete",
            "nome",
            "cpf",
            "telefone",
            "email",
            "data_nascimento",
            "titulo_eleitor",
            "zona_eleitoral",
            "secao_eleitoral",
            "local_votacao",
            "endereco",
            "bairro",
            "cidade",
            "observacoes",
            "criado_por",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = ["id", "gabinete", "criado_por", "criado_em", "atualizado_em"]
