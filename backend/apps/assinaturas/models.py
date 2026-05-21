from django.db import models
from django.utils import timezone


class Gabinete(models.Model):
    class StatusLicenca(models.TextChoices):
        ATIVA = "ativa", "Ativa"
        TESTE = "teste", "Teste"
        SUSPENSA = "suspensa", "Suspensa"
        EXPIRADA = "expirada", "Expirada"

    nome = models.CharField(max_length=150)
    vereador = models.CharField(max_length=150)
    email_responsavel = models.EmailField()
    telefone = models.CharField(max_length=20, blank=True)
    status_licenca = models.CharField(max_length=20, choices=StatusLicenca.choices, default=StatusLicenca.SUSPENSA)
    inicio_licenca = models.DateField(default=timezone.localdate)
    fim_licenca = models.DateField(null=True, blank=True)
    valor_mensal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    limite_usuarios = models.PositiveIntegerField(default=5)
    observacoes = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["nome"]

    def __str__(self):
        return self.nome

    @property
    def licenca_ativa(self):
        if self.status_licenca not in {self.StatusLicenca.ATIVA, self.StatusLicenca.TESTE}:
            return False
        return not self.fim_licenca or self.fim_licenca >= timezone.localdate()


class Cobranca(models.Model):
    class Status(models.TextChoices):
        ABERTA = "aberta", "Aberta"
        PAGA = "paga", "Paga"
        ATRASADA = "atrasada", "Atrasada"
        CANCELADA = "cancelada", "Cancelada"

    class Metodo(models.TextChoices):
        PIX = "pix", "PIX"
        BOLETO = "boleto", "Boleto"
        CARTAO = "cartao", "Cartao"
        TRANSFERENCIA = "transferencia", "Transferencia"
        MANUAL = "manual", "Manual"

    gabinete = models.ForeignKey(Gabinete, related_name="cobrancas", on_delete=models.CASCADE)
    referencia = models.CharField(max_length=20)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    vencimento = models.DateField()
    pago_em = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ABERTA)
    metodo_pagamento = models.CharField(max_length=20, choices=Metodo.choices, default=Metodo.PIX)
    codigo_pagamento = models.CharField(max_length=255, blank=True)
    gateway = models.CharField(max_length=50, blank=True)
    gateway_payment_id = models.CharField(max_length=120, blank=True)
    observacoes = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-vencimento"]

    def __str__(self):
        return f"{self.gabinete} - {self.referencia}"
