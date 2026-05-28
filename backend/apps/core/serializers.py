from pathlib import Path

from django.conf import settings
from rest_framework import serializers

from .models import Anexo, AuditLog, Comentario


class AuditLogSerializer(serializers.ModelSerializer):
    user_nome = serializers.CharField(source="user.nome", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = AuditLog
        fields = ["id", "user", "user_nome", "user_email", "action", "model_name", "object_id", "object_repr", "before", "after", "ip_address", "criado_em"]
        read_only_fields = fields


class ComentarioSerializer(serializers.ModelSerializer):
    criado_por_nome = serializers.CharField(source="criado_por.nome", read_only=True)

    class Meta:
        model = Comentario
        fields = ["id", "gabinete", "tipo_entidade", "objeto_id", "texto", "criado_por", "criado_por_nome", "criado_em"]
        read_only_fields = ["id", "gabinete", "criado_por", "criado_por_nome", "criado_em"]


class AnexoSerializer(serializers.ModelSerializer):
    enviado_por_nome = serializers.CharField(source="enviado_por.nome", read_only=True)
    arquivo_url = serializers.FileField(source="arquivo", read_only=True)

    class Meta:
        model = Anexo
        fields = ["id", "gabinete", "tipo_entidade", "objeto_id", "arquivo", "arquivo_url", "nome_original", "descricao", "enviado_por", "enviado_por_nome", "criado_em"]
        read_only_fields = ["id", "gabinete", "arquivo_url", "nome_original", "enviado_por", "enviado_por_nome", "criado_em"]

    def validate_arquivo(self, arquivo):
        max_size = getattr(settings, "ANEXO_MAX_UPLOAD_SIZE", 5 * 1024 * 1024)
        allowed_extensions = getattr(settings, "ANEXO_ALLOWED_EXTENSIONS", {".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"})
        allowed_content_types = getattr(settings, "ANEXO_ALLOWED_CONTENT_TYPES", {
            "application/pdf",
            "image/jpeg",
            "image/png",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        })

        extension = Path(arquivo.name or "").suffix.lower()
        content_type = getattr(arquivo, "content_type", "")

        if arquivo.size > max_size:
            raise serializers.ValidationError("Arquivo acima do tamanho maximo permitido.")
        if extension not in allowed_extensions:
            raise serializers.ValidationError("Extensao de arquivo nao permitida.")
        if content_type and content_type not in allowed_content_types:
            raise serializers.ValidationError("Tipo de arquivo nao permitido.")
        return arquivo
