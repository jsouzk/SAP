from django.contrib import admin

from .models import Encaminhamento


@admin.register(Encaminhamento)
class EncaminhamentoAdmin(admin.ModelAdmin):
    list_display = ("atendimento", "secretaria_destino", "responsavel", "data")
    search_fields = ("atendimento__nome", "secretaria_destino", "responsavel")
    list_filter = ("secretaria_destino", "data")
