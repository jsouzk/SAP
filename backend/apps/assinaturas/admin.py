from django.contrib import admin

from .models import Cobranca, Gabinete


@admin.register(Gabinete)
class GabineteAdmin(admin.ModelAdmin):
    list_display = ("nome", "vereador", "status_licenca", "fim_licenca", "limite_usuarios")
    list_filter = ("status_licenca",)
    search_fields = ("nome", "vereador", "email_responsavel")


@admin.register(Cobranca)
class CobrancaAdmin(admin.ModelAdmin):
    list_display = ("gabinete", "referencia", "valor", "vencimento", "status", "metodo_pagamento")
    list_filter = ("status", "metodo_pagamento", "vencimento")
    search_fields = ("gabinete__nome", "referencia", "gateway_payment_id")
