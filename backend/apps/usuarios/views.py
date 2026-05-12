from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Usuario
from .serializers import CustomTokenObtainPairSerializer, UsuarioSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = []


class UsuarioViewSet(ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["nome", "email", "cpf", "telefone", "tipo_usuario"]
    ordering_fields = ["nome", "email", "criado_em"]
