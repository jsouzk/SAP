from rest_framework import serializers

from .models import Oficio


class OficioSerializer(serializers.ModelSerializer):
    encaminhamento_resumo = serializers.SerializerMethodField()

    class Meta:
        model = Oficio
        fields = ["id", "encaminhamento", "encaminhamento_resumo", "numero", "conteudo", "criado_em", "atualizado_em"]
        read_only_fields = ["id", "numero", "encaminhamento_resumo", "criado_em", "atualizado_em"]

    def get_encaminhamento_resumo(self, obj):
        return f"{obj.encaminhamento.secretaria_destino} - {obj.encaminhamento.atendimento.nome}"
