from django.db import models
from cms.extensions import PageExtension
from cms.extensions.extension_pool import extension_pool


class AuthenticationExtension(PageExtension):
    authentication = models.BooleanField()

extension_pool.register(AuthenticationExtension)