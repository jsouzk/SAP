from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    gabinete_nome = serializers.CharField(source="gabinete.nome", read_only=True)
    gabinete_licenca_ativa = serializers.BooleanField(source="gabinete.licenca_ativa", read_only=True)
    gabinete_status_licenca = serializers.CharField(source="gabinete.status_licenca", read_only=True)

    class Meta:
        model = Usuario
        fields = ["id", "nome", "email", "cpf", "telefone", "gabinete", "gabinete_nome", "gabinete_licenca_ativa", "gabinete_status_licenca", "tipo_usuario", "is_platform_admin", "is_superuser", "password", "is_active", "criado_em"]
        read_only_fields = ["id", "gabinete_nome", "is_superuser", "criado_em"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
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


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UsuarioSerializer(self.user).data
        return data
