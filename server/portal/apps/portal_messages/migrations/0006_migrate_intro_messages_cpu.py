from django.conf import settings
from django.db import migrations

PORTAL_DASHBOARD_MESSAGE = (
    "This page allows you to monitor your job status, get help with tickets, "
    "and view the status of the High Performance Computing (HPC) systems."
)

CPU_DASHBOARD_MESSAGE = (
    "This page allows you to monitor your job status and get help with tickets. "
)

def migrate_dashboard_intro_message(apps, schema_editor):
    CustomMessageTemplate = apps.get_model("portal_messages", "CustomMessageTemplate")

    dashboard_message = (
        PORTAL_DASHBOARD_MESSAGE
        if getattr(settings, "IS_TACC_PORTAL", True)
        else CPU_DASHBOARD_MESSAGE
    )

    CustomMessageTemplate.objects.filter(
        component="DASHBOARD",
        message_type="info",
    ).update(message=dashboard_message)


class Migration(migrations.Migration):

    dependencies = [
        ("portal_messages", "0005_migrate_longer_messages"),
    ]

    operations = [
        migrations.RunPython(migrate_dashboard_intro_message),
    ]
