from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):
    dependencies = [
        ("atendimentos", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="atendimento",
            name="data_atendimento",
            field=models.DateField(default=django.utils.timezone.localdate),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="atendimento",
            name="atendido_por",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="atendimentos_realizados", to=settings.AUTH_USER_MODEL),
        ),
        migrations.RemoveField(
            model_name="atendimento",
            name="observacoes",
        ),
        migrations.RemoveField(
            model_name="atendimento",
            name="quantidade_pessoas",
        ),
    ]
