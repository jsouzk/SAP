from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.assinaturas.views import CobrancaViewSet, GabineteViewSet, minha_assinatura, saas_overview
from apps.atendimentos.views import AtendimentoViewSet
from apps.core.views import AnexoViewSet, AuditLogViewSet, ComentarioViewSet, busca_global, dashboard, expirar_licencas, exportacao_gabinete, historico, notificacoes, pendencias, relatorios
from apps.encaminhamentos.views import EncaminhamentoViewSet
from apps.oficios.views import OficioViewSet
from apps.pessoas.views import PessoaAtendidaViewSet
from apps.usuarios.views import CookieTokenRefreshView, CustomTokenObtainPairView, LogoutView, MeView, PasswordResetConfirmView, PasswordResetRequestView, UsuarioViewSet

router = DefaultRouter()
router.register("gabinetes", GabineteViewSet, basename="gabinetes")
router.register("cobrancas", CobrancaViewSet, basename="cobrancas")
router.register("usuarios", UsuarioViewSet, basename="usuarios")
router.register("pessoas", PessoaAtendidaViewSet, basename="pessoas")
router.register("atendimentos", AtendimentoViewSet, basename="atendimentos")
router.register("encaminhamentos", EncaminhamentoViewSet, basename="encaminhamentos")
router.register("oficios", OficioViewSet, basename="oficios")
router.register("auditoria", AuditLogViewSet, basename="auditoria")
router.register("comentarios", ComentarioViewSet, basename="comentarios")
router.register("anexos", AnexoViewSet, basename="anexos")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/dashboard/", dashboard, name="dashboard"),
    path("api/relatorios/", relatorios, name="relatorios"),
    path("api/notificacoes/", notificacoes, name="notificacoes"),
    path("api/admin-saas/overview/", saas_overview, name="saas_overview"),
    path("api/minha-assinatura/", minha_assinatura, name="minha_assinatura"),
    path("api/historico/", historico, name="historico"),
    path("api/pendencias/", pendencias, name="pendencias"),
    path("api/busca-global/", busca_global, name="busca_global"),
    path("api/licencas/expirar/", expirar_licencas, name="expirar_licencas"),
    path("api/exportacao-gabinete/", exportacao_gabinete, name="exportacao_gabinete"),
    path("api/auth/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", CookieTokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/logout/", LogoutView.as_view(), name="auth_logout"),
    path("api/auth/me/", MeView.as_view(), name="auth_me"),
    path("api/auth/password-reset/", PasswordResetRequestView.as_view(), name="password_reset"),
    path("api/auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
