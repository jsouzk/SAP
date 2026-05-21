from django.db import models
from django.conf import settings


class Atendimento(models.Model):
    gabinete = models.ForeignKey("assinaturas.Gabinete", related_name="atendimentos", on_delete=models.SET_NULL, null=True, blank=True)
    pessoa = models.ForeignKey("pessoas.PessoaAtendida", related_name="atendimentos", on_delete=models.SET_NULL, null=True, blank=True)
    nome = models.CharField(max_length=150)
    endereco = models.CharField(max_length=255)
    telefone = models.CharField(max_length=20)
    data_nascimento = models.DateField(null=True, blank=True)
    data_atendimento = models.DateField()
    quem_atendeu = models.CharField(max_length=150)
    local_trabalho = models.CharField(max_length=150, blank=True)
    assunto = models.CharField(max_length=120)
    criado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-criado_em"]

    def __str__(self):
        return f"{self.nome} - {self.assunto}"
