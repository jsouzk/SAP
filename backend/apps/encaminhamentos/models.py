from django.db import models

from apps.atendimentos.models import Atendimento


class Encaminhamento(models.Model):
    atendimento = models.ForeignKey(Atendimento, related_name="encaminhamentos", on_delete=models.CASCADE)
    vereador = models.CharField(max_length=150)
    secretaria_destino = models.CharField(max_length=150)
    responsavel = models.CharField(max_length=150)
    descricao = models.TextField()
    data = models.DateField()
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-data", "-criado_em"]

    def __str__(self):
        return f"{self.secretaria_destino} - {self.atendimento.nome}"
