from django.contrib import admin
from portal.apps.portal_messages.models import CustomMessageTemplate


@admin.register(CustomMessageTemplate)
class CustomMessageTemplateAdmin(admin.ModelAdmin):
    fields = ('message_type', 'component', 'message', 'dismissible')
