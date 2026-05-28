from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("atendimentos", "0005_atendimento_pessoa"),
    ]

    operations = [
        migrations.AddField(
            model_name="atendimento",
            name="prazo_retorno",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="atendimento",
            name="proxima_acao",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="atendimento",
            name="responsavel_retorno",
            field=models.CharField(blank=True, max_length=150),
        ),
        migrations.AddField(
            model_name="atendimento",
            name="status",
            field=models.CharField(
                choices=[
                    ("novo", "Novo"),
                    ("em_andamento", "Em andamento"),
                    ("encaminhado", "Encaminhado"),
                    ("resolvido", "Resolvido"),
                    ("arquivado", "Arquivado"),
                ],
                default="novo",
                max_length=20,
            ),
        ),
    ]
