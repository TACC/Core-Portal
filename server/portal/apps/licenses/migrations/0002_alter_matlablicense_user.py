# Generated by Django 4.2.10 on 2024-03-19 16:38

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('portal_licenses', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='matlablicense',
            name='user',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='%(class)s', to=settings.AUTH_USER_MODEL),
        ),
    ]
