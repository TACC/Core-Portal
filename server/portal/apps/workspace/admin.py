from django.contrib import admin
from portal.apps.workspace.models import (
    AppTrayEntry,
    AppTrayCategory
)


@admin.register(AppTrayCategory)
class AppTrayCategoryAdmin(admin.ModelAdmin):
    fields = ('category', 'priority', )


@admin.register(AppTrayEntry)
class AppTrayEntryAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Display Options', {
            'fields': ('label', 'category', 'icon', 'appType', 'available')
        }),
        ('Tapis App Specification', {
            'fields': ('appId', 'version')
        }),
        ('HTML - all fields required', {
            'fields': ('description', 'html')
        })
    )
