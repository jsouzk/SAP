from django.contrib import admin

from .models import Oficio


@admin.register(Oficio)
class OficioAdmin(admin.ModelAdmin):
    list_display = ("numero", "encaminhamento", "criado_em")
    search_fields = ("numero", "conteudo", "encaminhamento__atendimento__nome")
