from django.db import models
from django.conf import settings


class Atendimento(models.Model):
    class Status(models.TextChoices):
        NOVO = "novo", "Novo"
        EM_ANDAMENTO = "em_andamento", "Em andamento"
        ENCAMINHADO = "encaminhado", "Encaminhado"
        RESOLVIDO = "resolvido", "Resolvido"
        ARQUIVADO = "arquivado", "Arquivado"

    gabinete = models.ForeignKey("assinaturas.Gabinete", related_name="atendimentos", on_delete=models.SET_NULL, null=True, blank=True)
    pessoa = models.ForeignKey("pessoas.PessoaAtendida", related_name="atendimentos", on_delete=models.SET_NULL, null=True, blank=True)
    nome = models.CharField(max_length=150)
    endereco = models.CharField(max_length=255, blank=True)
    telefone = models.CharField(max_length=20)
    data_nascimento = models.DateField(null=True, blank=True)
    data_atendimento = models.DateField()
    quem_atendeu = models.CharField(max_length=150)
    local_trabalho = models.CharField(max_length=150, blank=True)
    assunto = models.CharField(max_length=120)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NOVO)
    prazo_retorno = models.DateField(null=True, blank=True)
    responsavel_retorno = models.CharField(max_length=150, blank=True)
    proxima_acao = models.TextField(blank=True)
    criado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    ativo = models.BooleanField(default=True, db_index=True)
    excluido_por = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="atendimentos_excluidos", on_delete=models.SET_NULL, null=True, blank=True)
    excluido_em = models.DateTimeField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-criado_em"]
        indexes = [
            models.Index(fields=["gabinete", "status"]),
            models.Index(fields=["gabinete", "prazo_retorno"]),
            models.Index(fields=["gabinete", "data_atendimento"]),
            models.Index(fields=["gabinete", "criado_em"]),
            models.Index(fields=["telefone"]),
        ]

    def __str__(self):
        return f"{self.nome} - {self.assunto}"
