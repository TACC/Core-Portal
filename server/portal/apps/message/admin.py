from django.contrib import admin
from portal.apps.message.models import CustomMessageTemplate

@admin.register(CustomMessageTemplate)
class CustomMessageTemplateAdmin(admin.ModelAdmin):
    fields = ('message_type', 'component', 'message', 'dismissible')
