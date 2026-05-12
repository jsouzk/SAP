from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from apps.atendimentos.views import AtendimentoViewSet
from apps.core.views import dashboard, historico
from apps.encaminhamentos.views import EncaminhamentoViewSet
from apps.oficios.views import OficioViewSet
from apps.usuarios.views import CustomTokenObtainPairView, UsuarioViewSet

router = DefaultRouter()
router.register("usuarios", UsuarioViewSet, basename="usuarios")
router.register("atendimentos", AtendimentoViewSet, basename="atendimentos")
router.register("encaminhamentos", EncaminhamentoViewSet, basename="encaminhamentos")
router.register("oficios", OficioViewSet, basename="oficios")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/dashboard/", dashboard, name="dashboard"),
    path("api/historico/", historico, name="historico"),
    path("api/auth/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
