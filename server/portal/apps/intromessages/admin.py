from django.contrib import admin
from portal.apps.intromessages.models import CustomMessageTemplate

@admin.register(CustomMessageTemplate)
class CustomMessageTemplateAdmin(admin.ModelAdmin):
    fields = ('message_type', 'component', 'message', 'dismissable')
