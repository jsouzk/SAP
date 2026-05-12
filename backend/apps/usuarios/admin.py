from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    model = Usuario
    list_display = ("nome", "email", "cpf", "tipo_usuario", "is_active", "is_staff")
    list_filter = ("tipo_usuario", "is_active", "is_staff")
    search_fields = ("nome", "email", "cpf")
    ordering = ("nome",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Dados pessoais", {"fields": ("nome", "cpf", "telefone", "tipo_usuario")}),
        ("Permissoes", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "nome", "cpf", "tipo_usuario", "password1", "password2")}),
    )
