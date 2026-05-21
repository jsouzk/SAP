from rest_framework.permissions import BasePermission


def is_platform_admin(user):
    return bool(user and user.is_authenticated and (user.is_superuser or getattr(user, "is_platform_admin", False)))


class IsPlatformAdmin(BasePermission):
    def has_permission(self, request, view):
        return is_platform_admin(request.user)


class HasActiveLicense(BasePermission):
    message = "Licenca do gabinete inativa ou expirada."

    def has_permission(self, request, view):
        if is_platform_admin(request.user):
            return True

        gabinete = getattr(request.user, "gabinete", None)
        return bool(gabinete and gabinete.licenca_ativa)
