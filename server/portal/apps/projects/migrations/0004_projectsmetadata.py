# Generated by Django 4.2.7 on 2024-03-07 16:22

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0003_alter_abstractprojectmetadata_co_pis_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProjectsMetadata',
            fields=[
                ('project_id', models.CharField(max_length=255, primary_key=True, serialize=False)),
                ('metadata', models.JSONField(default=dict, null=True)),
            ],
        ),
    ]