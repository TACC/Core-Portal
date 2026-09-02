import logging
from django.core.management import BaseCommand
from django.conf import settings
from tapipy.errors import NotFoundError
from portal.libs.agave.utils import service_account
from portal.apps.workspace.models import (
    AppTrayCategory,
    AppTrayEntry
)


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """
    This command imports the current set of apps specified with metadata
    as categories and associated app entries. App entries will be populated with
    id, specific version, category, and icon.
    """

    help = "Import all app metadata from the tenant into AppTrayCategory and AppTrayEntry models"

    def add_arguments(self, parser):
        parser.add_argument('-n', '--names', type=str, help="Portal app names to import")
        parser.add_argument('-c', '--clean', action='store_true', help="Remove nonexistant apps")
        parser.add_argument('-s', '--skip', action='store_true', help="Skip import")

    def clean(self):
        client = service_account()

        portal_apps = AppTrayEntry.objects.filter(appType='tapis')
        if portal_apps:
            logger.info("Deleting app entries with no corresponding app in tenant")

        for app in portal_apps:
            try:
                if app.version:
                    client.apps.getApp(appId=app.appId, appVersion=app.version)
                else:
                    client.apps.getAppLatestVersion(appId=app.appId)
            except NotFoundError:
                logger.info("App not found. id: {} and version: {}:. Deleting...".format(app.appId, app.version or 'None'))
                app.delete()

    def import_apps(self, portal_names):
        client = service_account()

        query = ["(enabled = TRUE) AND", f"((tags IN ('portalName: {portal_names[0]}'))"]
        for portal_name in portal_names[1:]:
            query.append(f"OR (tags IN ('portalName: {portal_name}'))")
        query.append(")")

        data = client.apps.searchAppsRequestBody(search=query, select="id,notes,version")
        for app in data:
            try:
                category = app.notes.get('category') or "Uncategorized"
                category_entry, _ = AppTrayCategory.objects.get_or_create(
                    category=category
                )

                app_entry = AppTrayEntry.objects.get_or_create(
                    category=category_entry,
                    icon=app.notes.get('icon') or "",
                    version=app.get('version') or "",
                    appId=app.get('id')
                )

                logger.info("Imported {}".format(app_entry))
            except Exception:
                logger.exception("Error importing application")
                logger.info("Following app could not be imported: {}".format(app))

    def handle(self, *args, **options):
        if options['clean']:
            self.clean()

        if not options['skip']:
            if options['names']:
                portal_names = options['names'].split(',')
            else:
                portal_names = settings.PORTAL_APPS_NAMES_SEARCH

            self.import_apps(portal_names)
