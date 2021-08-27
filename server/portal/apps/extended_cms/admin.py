from django.contrib import admin
from cms.extensions import PageExtensionAdmin

from .models import IconExtension


class AuthorizationExtensionAdmin(PageExtensionAdmin):
    pass

admin.site.register(AuthorizationExtension, AuthorizationExtensionAdmin)