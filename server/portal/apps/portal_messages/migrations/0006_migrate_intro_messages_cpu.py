from django.conf import settings
from django.db import migrations

PORTAL_DASHBOARD_MESSAGE = (
    "This page allows you to monitor your job status, get help with tickets, "
    "and view the status of the High Performance Computing (HPC) systems."
)

CPU_DASHBOARD_MESSAGE = (
    "This page allows you to monitor your job status and get help with tickets. "
)
PORTAL_DATAFILES_MESSAGE = (
    "This page allows you to upload and manage your files."
)

CPU_DATAFILES_MESSAGE = (
    "This page allows you to upload and manage your files. Management and actions "
    "available are dependent on your authorizations for each folder and file."
)


def migrate_intro_messages(apps, schema_editor):
    CustomMessageTemplate = apps.get_model("portal_messages", "CustomMessageTemplate")

    is_portal = getattr(settings, "IS_TACC_PORTAL", True)

    dashboard_message = (
        PORTAL_DASHBOARD_MESSAGE if is_portal else CPU_DASHBOARD_MESSAGE
    )
    datafiles_message = (
        PORTAL_DATAFILES_MESSAGE if is_portal else CPU_DATAFILES_MESSAGE
    )

    CustomMessageTemplate.objects.filter(
        component="DASHBOARD",
        message_type="info",
    ).update(message=dashboard_message)

    CustomMessageTemplate.objects.filter(
        component="DATA",
        message_type="info",
    ).update(message=datafiles_message)


class Migration(migrations.Migration):

    dependencies = [
        ("portal_messages", "0005_migrate_longer_messages"),
    ]

    operations = [
        migrations.RunPython(migrate_intro_messages),
    ]
