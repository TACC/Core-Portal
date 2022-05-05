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
        ('Agave App Specification', {
            'fields': ('name', 'version', 'revision', 'appId')
        }),
        ('HTML - all fields required', {
            'fields': ('shortDescription', 'htmlId', 'html', )
        })
    )
