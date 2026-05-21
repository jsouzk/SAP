from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from apps.assinaturas.views import CobrancaViewSet, GabineteViewSet, mercado_pago_retorno, mercado_pago_webhook, saas_overview
from apps.atendimentos.views import AtendimentoViewSet
from apps.core.views import dashboard, historico
from apps.encaminhamentos.views import EncaminhamentoViewSet
from apps.oficios.views import OficioViewSet
from apps.pessoas.views import PessoaAtendidaViewSet
from apps.usuarios.views import CustomTokenObtainPairView, UsuarioViewSet

router = DefaultRouter()
router.register("gabinetes", GabineteViewSet, basename="gabinetes")
router.register("cobrancas", CobrancaViewSet, basename="cobrancas")
router.register("usuarios", UsuarioViewSet, basename="usuarios")
router.register("pessoas", PessoaAtendidaViewSet, basename="pessoas")
router.register("atendimentos", AtendimentoViewSet, basename="atendimentos")
router.register("encaminhamentos", EncaminhamentoViewSet, basename="encaminhamentos")
router.register("oficios", OficioViewSet, basename="oficios")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/dashboard/", dashboard, name="dashboard"),
    path("api/admin-saas/overview/", saas_overview, name="saas_overview"),
    path("api/mercado-pago/webhook/", mercado_pago_webhook, name="mercado_pago_webhook"),
    path("api/mercado-pago/retorno/", mercado_pago_retorno, name="mercado_pago_retorno"),
    path("api/historico/", historico, name="historico"),
    path("api/auth/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
