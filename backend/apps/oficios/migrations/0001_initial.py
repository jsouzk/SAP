from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("encaminhamentos", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Oficio",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("numero", models.CharField(blank=True, max_length=20, unique=True)),
                ("conteudo", models.TextField(blank=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("encaminhamento", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="oficios", to="encaminhamentos.encaminhamento")),
            ],
            options={"ordering": ["-criado_em"]},
        ),
    ]
