from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("atendimentos", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Encaminhamento",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("vereador", models.CharField(max_length=150)),
                ("secretaria_destino", models.CharField(max_length=150)),
                ("responsavel", models.CharField(max_length=150)),
                ("descricao", models.TextField()),
                ("data", models.DateField()),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("atendimento", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="encaminhamentos", to="atendimentos.atendimento")),
            ],
            options={"ordering": ["-data", "-criado_em"]},
        ),
    ]
