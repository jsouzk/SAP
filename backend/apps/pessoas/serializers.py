from rest_framework import serializers

from apps.assinaturas.permissions import is_platform_admin
from apps.core.validators import format_cpf, format_phone, is_valid_cpf, is_valid_phone

from .models import PessoaAtendida


class PessoaAtendidaSerializer(serializers.ModelSerializer):
    linha_tempo = serializers.SerializerMethodField()

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
            "local_trabalho",
            "titulo_eleitor",
            "zona_eleitoral",
            "secao_eleitoral",
            "local_votacao",
            "endereco",
            "bairro",
            "cidade",
            "observacoes",
            "linha_tempo",
            "criado_por",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = ["id", "gabinete", "linha_tempo", "criado_por", "criado_em", "atualizado_em"]

    def get_linha_tempo(self, obj):
        eventos = []

        for atendimento in obj.atendimentos.all()[:20]:
            eventos.append({
                "tipo": "atendimento",
                "titulo": atendimento.assunto,
                "status": atendimento.status,
                "data": atendimento.criado_em,
                "descricao": atendimento.proxima_acao or atendimento.quem_atendeu,
            })

            for encaminhamento in atendimento.encaminhamentos.all()[:10]:
                eventos.append({
                    "tipo": "encaminhamento",
                    "titulo": encaminhamento.secretaria_destino,
                    "status": "",
                    "data": encaminhamento.criado_em,
                    "descricao": encaminhamento.descricao,
                })

                for oficio in encaminhamento.oficios.all()[:10]:
                    eventos.append({
                        "tipo": "oficio",
                        "titulo": oficio.numero,
                        "status": "",
                        "data": oficio.criado_em,
                        "descricao": oficio.conteudo[:160],
                    })

        eventos.sort(key=lambda item: item["data"], reverse=True)
        return eventos[:30]

    def validate_cpf(self, cpf):
        cpf = (cpf or "").strip()
        if not cpf:
            return cpf
        if not is_valid_cpf(cpf):
            raise serializers.ValidationError("CPF inválido.")

        request = self.context.get("request")
        user = getattr(request, "user", None)
        gabinete_id = self.initial_data.get("gabinete") if is_platform_admin(user) else getattr(user, "gabinete_id", None)

        normalized = format_cpf(cpf)
        queryset = PessoaAtendida.objects.filter(cpf=normalized)
        if gabinete_id:
            queryset = queryset.filter(gabinete_id=gabinete_id)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Já existe uma pessoa com este CPF neste gabinete.")
        return normalized

    def validate_telefone(self, telefone):
        if telefone and not is_valid_phone(telefone):
            raise serializers.ValidationError("Telefone deve ter DDD e 8 ou 9 dígitos.")
        return format_phone(telefone)
