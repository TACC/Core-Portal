from django.db import models

class Workshop(models.Model):
    title = models.CharField(max_length=512)
    access_code = models.CharField(max_length=255)
