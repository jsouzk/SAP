from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.assinaturas.permissions import HasActiveLicense, is_platform_admin

from .models import Usuario
from .serializers import CustomTokenObtainPairSerializer, UsuarioSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = []


class UsuarioViewSet(ModelViewSet):
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated, HasActiveLicense]
    search_fields = ["nome", "email", "cpf", "telefone", "tipo_usuario", "gabinete__nome"]
    ordering_fields = ["nome", "email", "criado_em"]

    def get_queryset(self):
        queryset = Usuario.objects.select_related("gabinete").all()
        if is_platform_admin(self.request.user):
            return queryset
        return queryset.filter(gabinete=self.request.user.gabinete)

    def perform_create(self, serializer):
        if is_platform_admin(self.request.user):
            serializer.save()
            return
        serializer.save(gabinete=self.request.user.gabinete, is_platform_admin=False)

    def perform_update(self, serializer):
        if is_platform_admin(self.request.user):
            serializer.save()
            return
        serializer.save(gabinete=self.request.user.gabinete, is_platform_admin=False)
