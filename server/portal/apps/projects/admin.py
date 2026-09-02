from django.contrib import admin
from portal.apps.projects.models.base import ProjectId


class ProjectIdAdmin(admin.ModelAdmin):
    pass


admin.site.register(ProjectId, ProjectIdAdmin)
