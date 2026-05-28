from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    class Action(models.TextChoices):
        CREATE = "create", "Criado"
        UPDATE = "update", "Atualizado"
        DELETE = "delete", "Excluído"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=20, choices=Action.choices)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=64)
    object_repr = models.CharField(max_length=255, blank=True)
    before = models.JSONField(null=True, blank=True)
    after = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]

    def __str__(self):
        return f"{self.action} {self.model_name}#{self.object_id}"


class Comentario(models.Model):
    class TipoEntidade(models.TextChoices):
        PESSOA = "pessoa", "Pessoa"
        ATENDIMENTO = "atendimento", "Atendimento"
        ENCAMINHAMENTO = "encaminhamento", "Encaminhamento"
        OFICIO = "oficio", "Ofício"

    gabinete = models.ForeignKey("assinaturas.Gabinete", on_delete=models.CASCADE, related_name="comentarios")
    tipo_entidade = models.CharField(max_length=30, choices=TipoEntidade.choices)
    objeto_id = models.PositiveIntegerField()
    texto = models.TextField()
    criado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]
        indexes = [
            models.Index(fields=["gabinete", "tipo_entidade", "objeto_id"]),
            models.Index(fields=["criado_em"]),
        ]

    def __str__(self):
        return f"{self.tipo_entidade}#{self.objeto_id}"


class Anexo(models.Model):
    class TipoEntidade(models.TextChoices):
        PESSOA = "pessoa", "Pessoa"
        ATENDIMENTO = "atendimento", "Atendimento"
        ENCAMINHAMENTO = "encaminhamento", "Encaminhamento"
        OFICIO = "oficio", "Ofício"

    gabinete = models.ForeignKey("assinaturas.Gabinete", on_delete=models.CASCADE, related_name="anexos")
    tipo_entidade = models.CharField(max_length=30, choices=TipoEntidade.choices)
    objeto_id = models.PositiveIntegerField()
    arquivo = models.FileField(upload_to="anexos/%Y/%m/")
    nome_original = models.CharField(max_length=255, blank=True)
    descricao = models.CharField(max_length=255, blank=True)
    enviado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]
        indexes = [
            models.Index(fields=["gabinete", "tipo_entidade", "objeto_id"]),
            models.Index(fields=["criado_em"]),
        ]

    def __str__(self):
        return self.nome_original or self.arquivo.name
