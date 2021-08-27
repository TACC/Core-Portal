from django.contrib import admin
from cms.extensions import PageExtensionAdmin

from .models import IconExtension

class AuthenticationExtensionAdmin(PageExtensionAdmin):
    pass

admin.site.register(AuthenticationExtension, AuthenticationExtensionAdmin)