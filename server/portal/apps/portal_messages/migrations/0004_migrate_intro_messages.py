from django.db import migrations

intro_messages = {
    "DASHBOARD": "This page allows you to monitor your job status, get help with tickets, and view the status of the High Performance Computing (HPC) systems.",
    "DATA": "This page allows you to upload and manage your files.",
    "ALLOCATIONS": "This page allows you to monitor the status of allocations on the HPC systems and view a breakdown of team usage.",
    "APPLICATIONS": "This page allows you to submit jobs to the HPC systems or access Cloud services using a variety of applications.",
    "HISTORY": "This page allows you to monitor a log of all previous job submissions.",
    "ACCOUNT": "This page allows you to manage your account profile, change your password and view software licenses.",
    "TICKETS": "This page allows you to submit a help request via an RT Ticket.",
    "UI": "This hidden page allows developers to review UI components in isolation.",
    "UNPROTECTED": "Note: this area is not authorized for protected data (i.e. PHI files). Please do not place any confidential/protected data in this space."
}


def migrate_intro_messages(apps, schema_editor):
    IntroMessages = apps.get_model('portal_messages', 'IntroMessages')
    CustomMessages = apps.get_model('portal_messages', 'CustomMessages')
    CustomMessageTemplate = apps.get_model('portal_messages', 'CustomMessageTemplate')
    for component, message in intro_messages.items():
        template = CustomMessageTemplate.objects.create(
            component=component,
            message_type='info',
            dismissible=True,
            message=message
        )

        for intro_message in IntroMessages.objects.filter(component=component):
            CustomMessages.objects.create(
                user=intro_message.user,
                template=template,
                unread=intro_message.unread
            )


class Migration(migrations.Migration):

    dependencies = [
        ('portal_messages', '0003_auto_20220819_2213'),
    ]

    operations = [
        migrations.RunPython(migrate_intro_messages),
    ]
