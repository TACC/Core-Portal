# Generated by Django 2.2.28 on 2022-11-15 20:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('portal_messages', '0004_migrate_intro_messages'),
    ]

    operations = [
        migrations.AlterField(
            model_name='custommessagetemplate',
            name='message',
            field=models.TextField(blank=True, default='', help_text='Message content (max 1000 characters)', max_length=1000),
        ),
    ]