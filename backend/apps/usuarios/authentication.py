from rest_framework_simplejwt.authentication import JWTAuthentication

from django.conf import settings
from rest_framework import exceptions
from rest_framework.authentication import CSRFCheck


SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}


def enforce_csrf(request):
    check = CSRFCheck(lambda req: None)
    check.process_request(request)
    reason = check.process_view(request, None, (), {})
    if reason:
        raise exceptions.PermissionDenied(f"CSRF Failed: {reason}")


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        header_auth = super().authenticate(request)
        if header_auth:
            return header_auth

        raw_token = request.COOKIES.get(settings.JWT_AUTH_COOKIE)
        if raw_token is None:
            return None

        if request.method not in SAFE_METHODS:
            enforce_csrf(request)

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
