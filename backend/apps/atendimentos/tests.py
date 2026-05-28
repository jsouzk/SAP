from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.assinaturas.models import Gabinete
from apps.atendimentos.models import Atendimento
from apps.core.models import AuditLog
from apps.encaminhamentos.models import Encaminhamento
from apps.pessoas.models import PessoaAtendida
from apps.usuarios.models import Usuario


class AtendimentoApiTests(TestCase):
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
            nome="Usuário",
            cpf="529.982.247-25",
            gabinete=self.gabinete,
        )
        self.client.force_authenticate(self.user)

    def test_normaliza_pessoa_e_grava_auditoria(self):
        response = self.client.post(reverse("pessoas-list"), {
            "nome": "Maria",
            "cpf": "52998224725",
            "telefone": "92999998888",
            "cidade": "Iranduba",
        })

        self.assertEqual(response.status_code, 201)
        pessoa = PessoaAtendida.objects.get()
        self.assertEqual(pessoa.cpf, "529.982.247-25")
        self.assertEqual(pessoa.telefone, "(92) 99999-8888")
        self.assertTrue(AuditLog.objects.filter(action=AuditLog.Action.CREATE, model_name="pessoas.PessoaAtendida").exists())

    def test_recusa_pessoa_de_outro_gabinete_no_atendimento(self):
        pessoa = PessoaAtendida.objects.create(nome="João", cpf="153.509.460-56", gabinete=self.outro_gabinete)

        response = self.client.post(reverse("atendimentos-list"), {
            "pessoa": pessoa.id,
            "nome": "João",
            "endereco": "Rua A",
            "telefone": "92999998888",
            "data_atendimento": timezone.localdate(),
            "quem_atendeu": "Atendente",
            "assunto": "Saúde",
        })

        self.assertEqual(response.status_code, 400)
        self.assertIn("pessoa", response.data)

    def test_pendencias_lista_prazo_vencido_e_encaminhamento_sem_oficio(self):
        atendimento = Atendimento.objects.create(
            gabinete=self.gabinete,
            nome="Maria",
            endereco="Rua A",
            telefone="(92) 99999-8888",
            data_atendimento=timezone.localdate() - timedelta(days=10),
            quem_atendeu="Atendente",
            assunto="Educação",
            status=Atendimento.Status.EM_ANDAMENTO,
            prazo_retorno=timezone.localdate() - timedelta(days=1),
        )
        Encaminhamento.objects.create(
            atendimento=atendimento,
            vereador="Vereador",
            secretaria_destino="Secretaria",
            responsavel="Responsável",
            descricao="Acompanhar",
            data=timezone.localdate(),
        )

        response = self.client.get(reverse("pendencias"))

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.data["resumo"]["prazo_vencido"], 1)
        self.assertGreaterEqual(response.data["resumo"]["encaminhamento_sem_oficio"], 1)

    def test_delete_atendimento_faz_exclusao_logica(self):
        atendimento = Atendimento.objects.create(
            gabinete=self.gabinete,
            nome="Maria",
            endereco="Rua A",
            telefone="(92) 99999-8888",
            data_atendimento=timezone.localdate(),
            quem_atendeu="Atendente",
            assunto="Educação",
        )

        response = self.client.delete(reverse("atendimentos-detail", args=[atendimento.id]))

        self.assertEqual(response.status_code, 204)
        atendimento.refresh_from_db()
        self.assertFalse(atendimento.ativo)
        self.assertEqual(atendimento.excluido_por, self.user)
        self.assertTrue(AuditLog.objects.filter(action=AuditLog.Action.DELETE, model_name="atendimentos.Atendimento").exists())
