# Generated by Django 4.2.16 on 2024-10-22 16:45

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0007_projectmetadata_and_more'),
        ('publications', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='publicationrequest',
            name='review_project',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='publication_reviews', to='projects.projectmetadata'),
        ),
        migrations.AlterField(
            model_name='publicationrequest',
            name='source_project',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='source_publication_reviews', to='projects.projectmetadata'),
        ),
    ]