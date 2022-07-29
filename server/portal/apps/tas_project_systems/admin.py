from django import forms
from django.forms import ModelForm
from django.contrib import admin
from django.conf import settings
from portal.apps.tas_project_systems.models import (
    TasProjectSystemEntry
)
from portal.apps.tas_project_systems.utils import (
    create_systems_for_tas_project,
    reset_cached_systems_for_username
)
from django.contrib.auth import get_user_model
import logging


logger = logging.getLogger(__name__)


class TasProjectSystemEntryAdminForm(ModelForm):
    model = TasProjectSystemEntry
    fields = ['project_sql_id', 'projectname', 'projectdir']

    def __init__(self, *args, **kwargs):
        super(TasProjectSystemEntryAdminForm, self).__init__(*args, **kwargs)
        templates = getattr(settings, 'PORTAL_TAS_PROJECT_SYSTEMS_TEMPLATES', {})
        self.fields['template'] = forms.ChoiceField(
            choices=[(template, template) for template in dict.keys(templates)]
        )


class TasProjectSystemEntryAdmin(admin.ModelAdmin):
    form = TasProjectSystemEntryAdminForm

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        for user in get_user_model().objects.all():
            logger.debug("Forcing TAS Project System Creation for user {} with TAS Project ID {}".format(user.username, obj.project_sql_id))
            create_systems_for_tas_project.apply_async(args=[user.username, obj.project_sql_id])

    def delete_model(self, request, obj):
        super().delete_model(request, obj)
        for user in get_user_model().objects.all():
            logger.debug("Removing cached entries for user {} with TAS Project ID {}".format(user.username, obj.project_sql_id))
            reset_cached_systems_for_username.apply_async(args=[user.username])


if getattr(settings, 'PORTAL_TAS_PROJECT_SYSTEMS_TEMPLATES', None) is not None:
    admin.site.register(TasProjectSystemEntry, TasProjectSystemEntryAdmin)
