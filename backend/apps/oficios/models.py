from django.db import models
from django.conf import settings
from django.utils import timezone

from apps.encaminhamentos.models import Encaminhamento


class Oficio(models.Model):
    encaminhamento = models.ForeignKey(Encaminhamento, related_name="oficios", on_delete=models.CASCADE)
    numero = models.CharField(max_length=20, unique=True, blank=True)
    conteudo = models.TextField(blank=True)
    ativo = models.BooleanField(default=True, db_index=True)
    excluido_por = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="oficios_excluidos", on_delete=models.SET_NULL, null=True, blank=True)
    excluido_em = models.DateTimeField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-criado_em"]
        indexes = [
            models.Index(fields=["numero"]),
            models.Index(fields=["criado_em"]),
        ]

    def __str__(self):
        return self.numero

    def save(self, *args, **kwargs):
        if not self.numero:
            last_id = Oficio.objects.order_by("-id").values_list("id", flat=True).first() or 0
            self.numero = f"{last_id + 1:04d}/{timezone.now().year}"
        if not self.conteudo:
            self.conteudo = self.gerar_conteudo()
        super().save(*args, **kwargs)

    def gerar_conteudo(self):
        atendimento = self.encaminhamento.atendimento
        gabinete = atendimento.gabinete
        template = getattr(gabinete, "template_oficio", "") if gabinete else ""
        contexto = {
            "nome": atendimento.nome,
            "assunto": atendimento.assunto,
            "descricao": self.encaminhamento.descricao,
            "secretaria": self.encaminhamento.secretaria_destino,
            "vereador": self.encaminhamento.vereador,
        }
        if template:
            try:
                return template.format(**contexto)
            except KeyError:
                pass
        return (
            f"Ao cumprimentar cordialmente Vossa Senhoria, venho por meio deste encaminhar a demanda "
            f"apresentada por {atendimento.nome}, referente ao assunto {atendimento.assunto}, para análise "
            "e providências cabíveis.\n\n"
            f"Relato do encaminhamento: {self.encaminhamento.descricao}\n\n"
            "Solicitamos retorno a este gabinete com as medidas adotadas, para que o atendimento parlamentar "
            "possa ser acompanhado e devidamente registrado."
        )
