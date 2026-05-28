from django.forms.models import model_to_dict
from django.utils import timezone

from .models import AuditLog


def client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def snapshot(instance):
    data = model_to_dict(instance)
    return {key: str(value) if value is not None else None for key, value in data.items()}


def write_audit_log(request, action, instance, before=None, after=None):
    user = getattr(request, "user", None)
    AuditLog.objects.create(
        user=user if getattr(user, "is_authenticated", False) else None,
        action=action,
        model_name=instance._meta.label,
        object_id=str(instance.pk),
        object_repr=str(instance)[:255],
        before=before,
        after=after,
        ip_address=client_ip(request),
    )


class AuditModelViewSetMixin:
    def perform_create(self, serializer):
        instance = serializer.save()
        write_audit_log(self.request, AuditLog.Action.CREATE, instance, after=snapshot(instance))
        return instance

    def perform_update(self, serializer):
        before = snapshot(self.get_object())
        instance = serializer.save()
        write_audit_log(self.request, AuditLog.Action.UPDATE, instance, before=before, after=snapshot(instance))
        return instance

    def perform_destroy(self, instance):
        before = snapshot(instance)
        write_audit_log(self.request, AuditLog.Action.DELETE, instance, before=before)
        if hasattr(instance, "ativo"):
            instance.ativo = False
            if hasattr(instance, "excluido_por"):
                instance.excluido_por = self.request.user
            if hasattr(instance, "excluido_em"):
                instance.excluido_em = timezone.now()
            instance.save(update_fields=["ativo", "excluido_por", "excluido_em", "atualizado_em"])
            return
        instance.delete()
