from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    model = Usuario
    list_display = ("nome", "email", "cpf", "gabinete", "tipo_usuario", "is_platform_admin", "is_active", "is_staff")
    list_filter = ("tipo_usuario", "is_platform_admin", "is_active", "is_staff")
    search_fields = ("nome", "email", "cpf")
    ordering = ("nome",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Dados pessoais", {"fields": ("nome", "cpf", "telefone", "gabinete", "tipo_usuario")}),
        ("Permissoes", {"fields": ("is_platform_admin", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "nome", "cpf", "gabinete", "tipo_usuario", "is_platform_admin", "password1", "password2")}),
    )
