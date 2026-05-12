from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Atendimento",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nome", models.CharField(max_length=150)),
                ("endereco", models.CharField(max_length=255)),
                ("telefone", models.CharField(max_length=20)),
                ("data_nascimento", models.DateField(blank=True, null=True)),
                ("quantidade_pessoas", models.PositiveIntegerField(default=1)),
                ("local_trabalho", models.CharField(blank=True, max_length=150)),
                ("assunto", models.CharField(max_length=120)),
                ("observacoes", models.TextField(blank=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("criado_por", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-criado_em"]},
        ),
    ]
