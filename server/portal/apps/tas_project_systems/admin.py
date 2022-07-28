from django import forms
from django.forms import ModelForm
from django.contrib import admin
from django.conf import settings
from portal.apps.tas_project_systems.models import (
    TasProjectSystemEntry
)


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


admin.site.register(TasProjectSystemEntry, TasProjectSystemEntryAdmin)
