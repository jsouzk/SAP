from django.db import models


class PessoaAtendida(models.Model):
    gabinete = models.ForeignKey("assinaturas.Gabinete", related_name="pessoas_atendidas", on_delete=models.SET_NULL, null=True, blank=True)
    nome = models.CharField(max_length=150)
    cpf = models.CharField("CPF", max_length=14, blank=True)
    telefone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    data_nascimento = models.DateField(null=True, blank=True)
    local_trabalho = models.CharField(max_length=150, blank=True)
    titulo_eleitor = models.CharField(max_length=30, blank=True)
    zona_eleitoral = models.CharField(max_length=20, blank=True)
    secao_eleitoral = models.CharField(max_length=20, blank=True)
    local_votacao = models.CharField(max_length=180, blank=True)
    endereco = models.CharField(max_length=255, blank=True)
    bairro = models.CharField(max_length=120, blank=True)
    cidade = models.CharField(max_length=120, default="Iranduba")
    observacoes = models.TextField(blank=True)
    criado_por = models.ForeignKey("usuarios.Usuario", on_delete=models.SET_NULL, null=True, blank=True)
    ativo = models.BooleanField(default=True, db_index=True)
    excluido_por = models.ForeignKey("usuarios.Usuario", related_name="pessoas_excluidas", on_delete=models.SET_NULL, null=True, blank=True)
    excluido_em = models.DateTimeField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["nome"]
        indexes = [
            models.Index(fields=["gabinete", "nome"]),
            models.Index(fields=["gabinete", "cpf"]),
            models.Index(fields=["telefone"]),
            models.Index(fields=["criado_em"]),
        ]

    def __str__(self):
        return self.nome
