from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("atendimentos", "0002_atendimento_data_atendimento_atendido_por_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="atendimento",
            name="quem_atendeu",
            field=models.CharField(default="Nao informado", max_length=150),
            preserve_default=False,
        ),
        migrations.RemoveField(
            model_name="atendimento",
            name="atendido_por",
        ),
    ]
