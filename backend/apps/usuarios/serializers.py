from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.utils import timezone

from apps.core.validators import format_cpf, format_phone, is_valid_cpf

from .models import Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    gabinete_nome = serializers.CharField(source="gabinete.nome", read_only=True)
    gabinete_licenca_ativa = serializers.BooleanField(source="gabinete.licenca_ativa", read_only=True)
    gabinete_status_licenca = serializers.CharField(source="gabinete.status_licenca", read_only=True)
    gabinete_fim_licenca = serializers.DateField(source="gabinete.fim_licenca", read_only=True)
    gabinete_dias_restantes = serializers.SerializerMethodField()
    gabinete_mensagem_licenca = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = ["id", "nome", "email", "cpf", "telefone", "gabinete", "gabinete_nome", "gabinete_licenca_ativa", "gabinete_status_licenca", "gabinete_fim_licenca", "gabinete_dias_restantes", "gabinete_mensagem_licenca", "tipo_usuario", "is_platform_admin", "is_superuser", "password", "is_active", "criado_em"]
        read_only_fields = ["id", "gabinete_nome", "is_superuser", "criado_em"]

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        is_platform = bool(user and user.is_authenticated and (user.is_superuser or getattr(user, "is_platform_admin", False)))

        if not is_platform:
            attrs.pop("is_platform_admin", None)
            attrs.pop("is_superuser", None)
            attrs.pop("gabinete", None)
            if attrs.get("tipo_usuario") == Usuario.TipoUsuario.ADMINISTRADOR and self.instance and self.instance == user:
                raise serializers.ValidationError("Voce nao pode alterar seu proprio perfil administrativo.")
            if self.instance and self.instance == user and attrs.get("is_active") is False:
                raise serializers.ValidationError("Voce nao pode desativar seu proprio usuario.")
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        if not password:
            raise serializers.ValidationError({"password": "Informe uma senha inicial."})
        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

    def validate_cpf(self, cpf):
        if not is_valid_cpf(cpf):
            raise serializers.ValidationError("CPF inválido.")
        return format_cpf(cpf)

    def validate_telefone(self, telefone):
        return format_phone(telefone)

    def get_gabinete_dias_restantes(self, obj):
        if not obj.gabinete or not obj.gabinete.fim_licenca:
            return None
        return (obj.gabinete.fim_licenca - timezone.localdate()).days

    def get_gabinete_mensagem_licenca(self, obj):
        gabinete = obj.gabinete
        if not gabinete:
            return "Usuário sem gabinete vinculado."
        if gabinete.licenca_ativa:
            if gabinete.fim_licenca:
                dias = (gabinete.fim_licenca - timezone.localdate()).days
                return f"Licença ativa. Vence em {dias} dia(s), em {gabinete.fim_licenca:%d/%m/%Y}."
            return "Licença ativa sem data de vencimento."
        if gabinete.fim_licenca and gabinete.fim_licenca < timezone.localdate():
            return f"Licença vencida desde {gabinete.fim_licenca:%d/%m/%Y}."
        return f"Licença {gabinete.status_licenca}."


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UsuarioSerializer(self.user).data
        return data


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "As senhas nao conferem."})

        try:
            user_id = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = Usuario.objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, Usuario.DoesNotExist):
            raise serializers.ValidationError({"token": "Link de recuperacao invalido ou expirado."})

        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError({"token": "Link de recuperacao invalido ou expirado."})

        validate_password(attrs["password"], user=user)
        attrs["user"] = user
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["password"])
        user.save(update_fields=["password"])
        return user
