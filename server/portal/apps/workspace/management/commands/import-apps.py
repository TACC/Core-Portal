import logging
from django.core.management import BaseCommand
from django.conf import settings
from portal.libs.agave.utils import service_account
from portal.apps.workspace.models import (
    AppTrayCategory,
    AppTrayEntry
)
import json


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """
    This command imports the current set of apps specified with metadata
    as categories and associated app entries. App entries will be populated with
    UUID, specific version and revision.
    """

    help = "Import all app metadata from the tenant into AppTrayCategory and AppTrayEntry models"

    def add_arguments(self, parser):
        parser.add_argument('-m', '--metadata', type=str, help="Portal App Metdata Names to import")

    def get_tag_value(self, definition, tag):
        """
        Searches an app definition for a tag and returns its value.
        """
        tag = tag + ":"
        return next((tag_value[len(tag):] for tag_value in definition['tags'] if tag_value.startswith(tag)), None)

    def handle(self, *args, **options):
        if options['metadata']:
            metadata = options['metadata'].split(',')
        else:
            metadata = settings.PORTAL_APPS_METADATA_NAMES

        agave = service_account()
        query = json.dumps({
            '$and': [
                {'name': {'$in': metadata}},
                {'value.definition.available': True}
            ]
        })
        data = agave.meta.listMetadata(q=query)

        for app in data:
            try:
                definition = app['value']['definition']
                appType = app['value']['type']
                category = self.get_tag_value(definition, "appCategory")
                icon = self.get_tag_value(definition, "appIcon") or ""
                category_entry, _ = AppTrayCategory.objects.get_or_create(
                    category=category
                )
                app_entry = AppTrayEntry.objects.create(
                    category=category_entry,
                    label=definition['label'],
                    icon=icon,
                    appType=appType,
                    version=definition['version'],
                    available=definition['available'],
                    shortDescription=definition['shortDescription'],
                )
                if appType == "html":
                    app_entry.htmlId = definition['id']
                    app_entry.html = definition['html']
                elif appType == "agave":
                    app_entry.appId = definition['id']
                    app_entry.name = definition['name']
                    app_entry.revision = definition['revision']
                    app_entry.lastRetrieved = definition['id']

                app_entry.save()
                logger.info("Imported {}".format(app_entry))
            except Exception:
                logger.exception("Error importing application")
                logger.info("Following app could not be imported: {}".format(app))
