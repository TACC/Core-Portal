# Generated by Django 2.2.28 on 2022-07-27 19:01

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='TasProjectSystemEntry',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('project_sql_id', models.IntegerField(help_text='The TAS project ID to match for the user')),
                ('projectname', models.CharField(help_text='The project name', max_length=64)),
                ('projectdir', models.CharField(help_text='The project directory to use within the system', max_length=64)),
                ('template', models.CharField(help_text='The template to use for creating TAPIS systems', max_length=64)),
            ],
        ),
    ]