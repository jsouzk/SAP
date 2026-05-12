from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("O email e obrigatorio.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("tipo_usuario", "administrador")
        extra_fields.setdefault("nome", "Administrador")
        return self.create_user(email, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    class TipoUsuario(models.TextChoices):
        ADMINISTRADOR = "administrador", "Administrador"
        ASSESSOR = "assessor", "Assessor"
        ATENDENTE = "atendente", "Atendente"
        VEREADOR = "vereador", "Vereador"

    nome = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    cpf = models.CharField("CPF", max_length=14, unique=True)
    telefone = models.CharField(max_length=20, blank=True)
    tipo_usuario = models.CharField(max_length=20, choices=TipoUsuario.choices, default=TipoUsuario.ATENDENTE)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    objects = UsuarioManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nome", "cpf"]

    class Meta:
        ordering = ["nome"]

    def __str__(self):
        return self.nome
