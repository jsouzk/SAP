from django.db import migrations


TABLES = [
    "django_migrations",
    "django_content_type",
    "auth_permission",
    "auth_group",
    "auth_group_permissions",
    "usuarios_usuario_groups",
    "usuarios_usuario_user_permissions",
    "django_admin_log",
    "assinaturas_cobranca",
    "assinaturas_gabinete",
    "pessoas_pessoaatendida",
    "atendimentos_atendimento",
    "core_anexo",
    "core_auditlog",
    "core_comentario",
    "oficios_oficio",
    "encaminhamentos_encaminhamento",
    "django_session",
    "usuarios_usuario",
]


def enable_rls(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    with schema_editor.connection.cursor() as cursor:
        for table in TABLES:
            cursor.execute(f'ALTER TABLE IF EXISTS public."{table}" ENABLE ROW LEVEL SECURITY;')


def disable_rls(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    with schema_editor.connection.cursor() as cursor:
        for table in TABLES:
            cursor.execute(f'ALTER TABLE IF EXISTS public."{table}" DISABLE ROW LEVEL SECURITY;')


class Migration(migrations.Migration):

    dependencies = [
        ("admin", "0003_logentry_add_action_flag_choices"),
        ("auth", "0012_alter_user_first_name_max_length"),
        ("contenttypes", "0002_remove_content_type_name"),
        ("sessions", "0001_initial"),
        ("assinaturas", "0004_gabinete_assinatura_cargo_gabinete_assinatura_nome_and_more"),
        ("usuarios", "0003_usuario_gabinete_usuario_is_platform_admin"),
        ("pessoas", "0003_pessoaatendida_local_trabalho"),
        ("atendimentos", "0008_alter_atendimento_endereco"),
        ("encaminhamentos", "0002_encaminhamento_ativo_encaminhamento_excluido_em_and_more"),
        ("oficios", "0002_oficio_ativo_oficio_excluido_em_oficio_excluido_por_and_more"),
        ("core", "0003_alter_auditlog_action"),
    ]

    operations = [
        migrations.RunPython(enable_rls, reverse_code=disable_rls),
    ]
