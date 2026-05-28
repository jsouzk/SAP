from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.assinaturas.models import Gabinete
from apps.core.models import Comentario
from apps.pessoas.models import PessoaAtendida
from apps.usuarios.models import Usuario


class ComentarioApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.gabinete = Gabinete.objects.create(
            nome="Gabinete A",
            vereador="Vereador A",
            email_responsavel="a@example.com",
            status_licenca=Gabinete.StatusLicenca.ATIVA,
            fim_licenca=timezone.localdate() + timedelta(days=30),
        )
        self.outro_gabinete = Gabinete.objects.create(
            nome="Gabinete B",
            vereador="Vereador B",
            email_responsavel="b@example.com",
            status_licenca=Gabinete.StatusLicenca.ATIVA,
            fim_licenca=timezone.localdate() + timedelta(days=30),
        )
        self.user = Usuario.objects.create_user(
            email="user@example.com",
            password="senha-teste",
            nome="Usuario",
            cpf="529.982.247-25",
            gabinete=self.gabinete,
        )
        self.platform_admin = Usuario.objects.create_user(
            email="admin@example.com",
            password="senha-teste",
            nome="Admin Plataforma",
            cpf="153.509.460-56",
            is_platform_admin=True,
            tipo_usuario=Usuario.TipoUsuario.ADMINISTRADOR,
        )
        self.pessoa = PessoaAtendida.objects.create(nome="Maria", gabinete=self.gabinete)
        self.pessoa_outro_gabinete = PessoaAtendida.objects.create(nome="Joao", gabinete=self.outro_gabinete)

    def test_cria_comentario_no_gabinete_do_objeto(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(reverse("comentarios-list"), {
            "tipo_entidade": "pessoa",
            "objeto_id": self.pessoa.id,
            "texto": "Retorno agendado.",
        })

        self.assertEqual(response.status_code, 201)
        comentario = Comentario.objects.get()
        self.assertEqual(comentario.gabinete, self.gabinete)
        self.assertEqual(comentario.criado_por, self.user)

    def test_admin_plataforma_sem_gabinete_cria_comentario_pelo_objeto(self):
        self.client.force_authenticate(self.platform_admin)

        response = self.client.post(reverse("comentarios-list"), {
            "tipo_entidade": "pessoa",
            "objeto_id": self.pessoa.id,
            "texto": "Analise administrativa.",
        })

        self.assertEqual(response.status_code, 201)
        comentario = Comentario.objects.get()
        self.assertEqual(comentario.gabinete, self.gabinete)
        self.assertEqual(comentario.criado_por, self.platform_admin)

    def test_recusa_comentario_em_objeto_de_outro_gabinete(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(reverse("comentarios-list"), {
            "tipo_entidade": "pessoa",
            "objeto_id": self.pessoa_outro_gabinete.id,
            "texto": "Nao deveria gravar.",
        })

        self.assertEqual(response.status_code, 400)
        self.assertIn("objeto_id", response.data)
        self.assertEqual(Comentario.objects.count(), 0)
