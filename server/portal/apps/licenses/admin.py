from django.contrib import admin
import models


@admin.register(models.MATLABLicense)
class MATLABLicenseAdmin(admin.ModelAdmin):
    readonly_fields = ('license_type', )
