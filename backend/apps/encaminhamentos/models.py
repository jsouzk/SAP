from django.db import models
from django.conf import settings

from apps.atendimentos.models import Atendimento


class Encaminhamento(models.Model):
    atendimento = models.ForeignKey(Atendimento, related_name="encaminhamentos", on_delete=models.CASCADE)
    vereador = models.CharField(max_length=150)
    secretaria_destino = models.CharField(max_length=150)
    responsavel = models.CharField(max_length=150)
    descricao = models.TextField()
    data = models.DateField()
    ativo = models.BooleanField(default=True, db_index=True)
    excluido_por = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="encaminhamentos_excluidos", on_delete=models.SET_NULL, null=True, blank=True)
    excluido_em = models.DateTimeField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-data", "-criado_em"]
        indexes = [
            models.Index(fields=["atendimento", "data"]),
            models.Index(fields=["secretaria_destino"]),
            models.Index(fields=["criado_em"]),
        ]

    def __str__(self):
        return f"{self.secretaria_destino} - {self.atendimento.nome}"
