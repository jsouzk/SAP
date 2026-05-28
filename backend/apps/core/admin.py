from django.contrib import admin

from .models import Anexo, AuditLog, Comentario


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("criado_em", "user", "action", "model_name", "object_id", "ip_address")
    list_filter = ("action", "model_name", "criado_em")
    search_fields = ("model_name", "object_id", "object_repr", "user__email", "user__nome")
    readonly_fields = ("user", "action", "model_name", "object_id", "object_repr", "before", "after", "ip_address", "criado_em")


@admin.register(Comentario)
class ComentarioAdmin(admin.ModelAdmin):
    list_display = ("criado_em", "gabinete", "tipo_entidade", "objeto_id", "criado_por")
    search_fields = ("texto", "criado_por__nome", "gabinete__nome")


@admin.register(Anexo)
class AnexoAdmin(admin.ModelAdmin):
    list_display = ("criado_em", "gabinete", "tipo_entidade", "objeto_id", "nome_original", "enviado_por")
    search_fields = ("nome_original", "descricao", "enviado_por__nome", "gabinete__nome")
