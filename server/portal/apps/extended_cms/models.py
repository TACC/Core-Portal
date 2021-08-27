from django.db import models
from cms.extensions import PageExtension
from cms.extensions.extension_pool import extension_pool


class AuthorizationExtension(PageExtension):
    pass

extension_pool.register(AuthorizationExtension)