# Generated by Django 2.2.16 on 2020-11-12 20:02

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AbstractProjectMetadata',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.TextField()),
                ('project_id', models.CharField(db_index=True, max_length=255)),
                ('description', models.TextField(blank=True, null=True)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('last_modified', models.DateTimeField(auto_now=True)),
                ('co_pis', models.ManyToManyField(blank=True, null=True, related_name='rel_co_pi_abstractprojectmetadata', related_query_name='co_pi_abstractprojectmetadata', to=settings.AUTH_USER_MODEL)),
                ('owner', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='rel_owner_abstractprojectmetadata', related_query_name='owner_abstractprojectmetadata', to=settings.AUTH_USER_MODEL)),
                ('pi', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='rel_pi_abstractprojectmetadata', related_query_name='pi_abstractprojectmetadata', to=settings.AUTH_USER_MODEL)),
                ('team_members', models.ManyToManyField(blank=True, null=True, related_name='rel_member_abstractprojectmetadata', related_query_name='member_abstractprojectmetadata', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='ProjectId',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('value', models.IntegerField()),
                ('last_updated', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='ProjectMetadata',
            fields=[
                ('abstractprojectmetadata_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='projects.AbstractProjectMetadata')),
            ],
            bases=('projects.abstractprojectmetadata',),
        ),
    ]
