from django.core.management import BaseCommand
from django.utils.six.moves import input
from django.conf import settings
import elasticsearch
from elasticsearch_dsl import Index
from elasticsearch_dsl.connections import connections  # noqa: F401
from portal.libs.elasticsearch.indexes import setup_files_index


class Command(BaseCommand):
    """
    This command reindexes all documents in the default files index in order to
    apply new mappings/analyzers. It does NOT crawl Agave for file metadata, it
    only uses data that already exists in the file index. Usage is as simple as
    running `./manage.py reindex-files`.

    This works by resetting the index aliased as settings.ES_REINDEX_INDEX_ALIAS
    (applying any new mappings/analyzers defined in the portal.libs.elasticsearch.docs.base.IndexedFile
     class) and reindexing from the default files index to this new index. The
     aliases are then swapped so that any Elasticsearch queries on the backend now
     target the reindexed documents.
    """

    help = "Reindex all files into a fresh index, then swap aliases with the current default index."

    def add_arguments(self, parser):
        parser.add_argument('--cleanup', help='Remove documents after swapping aliases to save space.', default=False, action='store_true')
        parser.add_argument('--swap-only', help='Only swap index aliases without reindexing.', default=False, action='store_true')

    def handle(self, *args, **options):
        es_client = elasticsearch.Elasticsearch([{'host': settings.ES_HOSTS, 'http_auth': settings.ES_AUTH}], timeout=60)
        cleanup = options.get('cleanup')
        swap_only = options.get('swap-only')
        default_index_alias = settings.ES_INDEX_PREFIX.format('files')
        reindex_index_alias = settings.ES_INDEX_PREFIX.format('files-reindex')

        if not swap_only:
            confirm = input('This will delete any documents in the index "{}" and recreate the index. Continue? (Y/n) '.format(reindex_index_alias))
            if confirm != 'Y':
                self.stdout.write('Aborting reindex.')
                raise SystemExit
            # Set up a fresh reindexing alias.
            setup_files_index(reindex=True, force=True)

        try:
            default_index_name = Index(default_index_alias, using=es_client).get_alias().keys()[0]
            reindex_index_name = Index(reindex_index_alias, using=es_client).get_alias().keys()[0]
        except Exception:
            self.stdout.write('Unable to lookup required indices by alias. Have you set up both a default and a reindexing index?')
            raise SystemExit

        if not swap_only:
            # Reindex file metadata from the default index to the reindexing index
            elasticsearch.helpers.reindex(es_client, default_index_name, reindex_index_name)

        alias_body = {
            'actions': [
                {'remove': {'index': default_index_name, 'alias': default_index_alias}},
                {'remove': {'index': reindex_index_name, 'alias': reindex_index_alias}},
                {'add': {'index': default_index_name, 'alias': reindex_index_alias}},
                {'add': {'index': reindex_index_name, 'alias': default_index_alias}},
            ]
        }
        # Swap the aliases of the default and reindexing aliases.
        es_client.indices.update_aliases(alias_body)

        # Re-initialize the new reindexing index to save space.
        if cleanup:
            reindex_index_name = Index(reindex_index_alias, using=es_client).get_alias().keys()[0]
            Index(reindex_index_name, using=es_client).delete(ignore=404)
