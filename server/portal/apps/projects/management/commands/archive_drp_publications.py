from django.core.management.base import BaseCommand
from portal.apps.projects.workspace_operations.project_publish_operations import archive_publication_files, upload_metadata_file
from portal.apps.publications.models import Publication

class Command(BaseCommand):
    help = "Archive Digital Rocks publications."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run', 
            action='store_true', 
            help="Run the command without saving changes."
        )

        parser.add_argument(
            '--project-id',
            type=str,
            help="Specify a project ID to archive."
        )

    def handle(self, *args, **options):

        publications = []

        if options['project_id']:
            publications = list(Publication.objects.filter(project_id__in=options['project_id']))
        else: 
            publications = list(Publication.objects.all())

        print(f'Found {len(publications)} publications to archive.')
        
        for pub in publications:
            project_id = pub.project_id
            upload_metadata_file(project_id, pub.tree)
            archive_publication_files(project_id)
            print(f'Submitted archive files job for publication id {project_id}.')