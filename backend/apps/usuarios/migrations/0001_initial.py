from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.CreateModel(
            name="Usuario",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("password", models.CharField(max_length=128, verbose_name="password")),
                ("last_login", models.DateTimeField(blank=True, null=True, verbose_name="last login")),
                ("is_superuser", models.BooleanField(default=False)),
                ("nome", models.CharField(max_length=150)),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("cpf", models.CharField(max_length=14, unique=True, verbose_name="CPF")),
                ("telefone", models.CharField(blank=True, max_length=20)),
                ("tipo_usuario", models.CharField(choices=[("administrador", "Administrador"), ("assessor", "Assessor"), ("atendente", "Atendente"), ("vereador", "Vereador")], default="atendente", max_length=20)),
                ("is_active", models.BooleanField(default=True)),
                ("is_staff", models.BooleanField(default=False)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("groups", models.ManyToManyField(blank=True, related_name="user_set", related_query_name="user", to="auth.group")),
                ("user_permissions", models.ManyToManyField(blank=True, related_name="user_set", related_query_name="user", to="auth.permission")),
            ],
            options={"ordering": ["nome"]},
        ),
    ]
