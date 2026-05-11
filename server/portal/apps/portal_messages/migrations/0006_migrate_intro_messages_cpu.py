from django.conf import settings
from django.db import migrations


CPU_DASHBOARD_MESSAGE = (
    "This page allows you to monitor your job status and get help with tickets. "
)

CPU_DATAFILES_MESSAGE = (
    "This page allows you to upload and manage your files. Management and actions "
    "available are dependent on your authorizations for each folder and file."
)


def migrate_intro_messages(apps, schema_editor):
    CustomMessageTemplate = apps.get_model("portal_messages", "CustomMessageTemplate")

    if not getattr(settings, "IS_TACC_PORTAL", False):
        CustomMessageTemplate.objects.filter(
            component="DASHBOARD",
            message_type="info",
        ).update(message=CPU_DASHBOARD_MESSAGE)

        CustomMessageTemplate.objects.filter(
            component="DATA",
            message_type="info",
        ).update(message=CPU_DATAFILES_MESSAGE)


class Migration(migrations.Migration):

    dependencies = [
        ("portal_messages", "0005_migrate_longer_messages"),
    ]

    operations = [
        migrations.RunPython(migrate_intro_messages),
    ]
