from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.middleware.csrf import get_token
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

from apps.assinaturas.permissions import HasActiveLicense, IsGabineteAdminOrPlatform, is_platform_admin
from apps.core.audit import AuditModelViewSetMixin, write_audit_log, snapshot
from apps.core.models import AuditLog

from .models import Usuario
from .authentication import enforce_csrf
from .serializers import CustomTokenObtainPairSerializer, PasswordResetConfirmSerializer, PasswordResetRequestSerializer, UsuarioSerializer


def _cookie_kwargs(max_age):
    return {
        "max_age": int(max_age.total_seconds()),
        "path": "/api/",
        "secure": settings.JWT_COOKIE_SECURE,
        "httponly": settings.JWT_COOKIE_HTTP_ONLY,
        "samesite": settings.JWT_COOKIE_SAMESITE,
    }


def set_auth_cookies(response, access=None, refresh=None):
    if access:
        response.set_cookie(
            settings.JWT_AUTH_COOKIE,
            access,
            **_cookie_kwargs(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"]),
        )
    if refresh:
        response.set_cookie(
            settings.JWT_REFRESH_COOKIE,
            refresh,
            **_cookie_kwargs(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"]),
        )
    return response


def set_csrf_cookie(request, response):
    token = get_token(request)
    if isinstance(response.data, dict):
        response.data["csrfToken"] = token
    response.set_cookie(
        settings.CSRF_COOKIE_NAME,
        token,
        max_age=settings.CSRF_COOKIE_AGE,
        path=settings.CSRF_COOKIE_PATH,
        secure=settings.CSRF_COOKIE_SECURE,
        httponly=settings.CSRF_COOKIE_HTTPONLY,
        samesite=settings.CSRF_COOKIE_SAMESITE,
    )
    return response


def clear_auth_cookies(response):
    common = {
        "path": "/api/",
        "samesite": settings.JWT_COOKIE_SAMESITE,
    }
    response.delete_cookie(settings.JWT_AUTH_COOKIE, **common)
    response.delete_cookie(settings.JWT_REFRESH_COOKIE, **common)
    response.delete_cookie(settings.CSRF_COOKIE_NAME, path=settings.CSRF_COOKIE_PATH, samesite=settings.CSRF_COOKIE_SAMESITE)
    return response


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = []

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        access = response.data.pop("access", None)
        refresh = response.data.pop("refresh", None)
        user_id = response.data.get("user", {}).get("id")
        user = Usuario.objects.filter(pk=user_id).first()
        if user:
            write_audit_log(request, AuditLog.Action.LOGIN, user, after={"email": user.email})
        set_auth_cookies(response, access=access, refresh=refresh)
        set_csrf_cookie(request, response)
        return response


class CookieTokenRefreshView(APIView):
    permission_classes = []

    def post(self, request):
        enforce_csrf(request)
        refresh = request.COOKIES.get(settings.JWT_REFRESH_COOKIE) or request.data.get("refresh")
        if not refresh:
            return Response({"detail": "Sessao expirada."}, status=401)

        serializer = TokenRefreshSerializer(data={"refresh": refresh})
        serializer.is_valid(raise_exception=True)
        response = Response({"detail": "Sessao renovada."})
        set_auth_cookies(response, access=serializer.validated_data.get("access"))
        set_csrf_cookie(request, response)
        return response


class LogoutView(APIView):
    permission_classes = []

    def post(self, request):
        enforce_csrf(request)
        if getattr(request.user, "is_authenticated", False):
            write_audit_log(request, AuditLog.Action.LOGOUT, request.user, after={"email": request.user.email})
        return clear_auth_cookies(Response({"detail": "Sessao encerrada."}))


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        request.user.last_login = request.user.last_login or timezone.now()
        response = Response({"user": UsuarioSerializer(request.user).data})
        set_csrf_cookie(request, response)
        return response


class PasswordResetRequestView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        user = Usuario.objects.filter(email__iexact=email, is_active=True).first()

        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/redefinir-senha/{uid}/{token}"
            send_mail(
                subject="Recuperacao de senha",
                message=(
                    f"Ola, {user.nome}.\n\n"
                    "Recebemos uma solicitacao para redefinir sua senha no Sistema de Atendimento Parlamentar.\n"
                    f"Acesse o link abaixo para criar uma nova senha:\n\n{reset_url}\n\n"
                    "Se voce nao solicitou essa alteracao, ignore este email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )

        return Response({"detail": "Se o email estiver cadastrado, enviaremos um link de recuperacao."})


class PasswordResetConfirmView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Senha redefinida com sucesso."})


class UsuarioViewSet(AuditModelViewSetMixin, ModelViewSet):
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated, HasActiveLicense, IsGabineteAdminOrPlatform]
    search_fields = ["nome", "email", "cpf", "telefone", "tipo_usuario", "gabinete__nome"]
    ordering_fields = ["nome", "email", "criado_em"]

    def get_queryset(self):
        queryset = Usuario.objects.select_related("gabinete").all()
        if is_platform_admin(self.request.user):
            return queryset
        return queryset.filter(gabinete=self.request.user.gabinete)

    def perform_create(self, serializer):
        if is_platform_admin(self.request.user):
            instance = serializer.save()
            write_audit_log(self.request, AuditLog.Action.CREATE, instance, after=snapshot(instance))
            return
        instance = serializer.save(gabinete=self.request.user.gabinete, is_platform_admin=False)
        write_audit_log(self.request, AuditLog.Action.CREATE, instance, after=snapshot(instance))

    def perform_update(self, serializer):
        before = snapshot(self.get_object())
        if is_platform_admin(self.request.user):
            instance = serializer.save()
            write_audit_log(self.request, AuditLog.Action.UPDATE, instance, before=before, after=snapshot(instance))
            return
        instance = serializer.save(gabinete=self.request.user.gabinete, is_platform_admin=False)
        write_audit_log(self.request, AuditLog.Action.UPDATE, instance, before=before, after=snapshot(instance))
