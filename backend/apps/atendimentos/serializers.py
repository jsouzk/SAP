from rest_framework import serializers

from apps.assinaturas.permissions import is_platform_admin
from apps.core.validators import format_phone

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
            "status",
            "prazo_retorno",
            "responsavel_retorno",
            "proxima_acao",
            "criado_por",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = ["id", "pessoa_nome", "criado_por", "criado_em", "atualizado_em"]

    def validate_pessoa(self, pessoa):
        if not pessoa:
            return pessoa

        request = self.context.get("request")
        user = getattr(request, "user", None)
        if is_platform_admin(user):
            return pessoa

        if pessoa.gabinete_id != getattr(user, "gabinete_id", None):
            raise serializers.ValidationError("Pessoa não pertence ao seu gabinete.")
        return pessoa

    def validate_telefone(self, telefone):
        return format_phone(telefone)
