from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient

from apps.usuarios.models import Usuario


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend", FRONTEND_URL="http://localhost:5173")
class PasswordResetApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = Usuario.objects.create_user(
            email="usuario@example.com",
            password="senha-antiga-123",
            nome="Usuario",
            cpf="529.982.247-25",
        )

    def test_envia_email_de_recuperacao_para_usuario_ativo(self):
        response = self.client.post(reverse("password_reset"), {"email": self.user.email})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("/redefinir-senha/", mail.outbox[0].body)
        self.assertIn("http://localhost:5173", mail.outbox[0].body)

    def test_nao_revela_email_inexistente(self):
        response = self.client.post(reverse("password_reset"), {"email": "naoexiste@example.com"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)

    def test_redefine_senha_com_token_valido(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        response = self.client.post(
            reverse("password_reset_confirm"),
            {
                "uid": uid,
                "token": token,
                "password": "Nova-senha-123",
                "password_confirm": "Nova-senha-123",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("Nova-senha-123"))
