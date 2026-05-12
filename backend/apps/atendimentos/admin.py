from django.contrib import admin

from .models import Atendimento


@admin.register(Atendimento)
class AtendimentoAdmin(admin.ModelAdmin):
    list_display = ("nome", "telefone", "assunto", "criado_em")
    search_fields = ("nome", "telefone", "assunto")
    list_filter = ("assunto", "criado_em")
