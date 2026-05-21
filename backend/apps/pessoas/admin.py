from django.contrib import admin

from .models import PessoaAtendida


@admin.register(PessoaAtendida)
class PessoaAtendidaAdmin(admin.ModelAdmin):
    list_display = ("nome", "cpf", "telefone", "gabinete", "titulo_eleitor")
    search_fields = ("nome", "cpf", "telefone", "email", "titulo_eleitor")
    list_filter = ("gabinete", "cidade")
