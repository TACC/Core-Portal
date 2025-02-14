from django.core.management.base import BaseCommand
from django.conf import settings
import networkx as nx
from portal.apps.projects.migration_utils.sql_db_utils import get_project_by_id, query_projects, query_published_projects
from portal.apps.publications.models import Publication
from portal.libs.agave.utils import service_account
from portal.apps.projects.workspace_operations.project_publish_operations import _add_values_to_tree

class Command(BaseCommand):
    help = "Migrate DRP project files to the new location."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run', 
            action='store_true', 
            help="Run the command without saving changes."
        )

        parser.add_argument(
            '--project-id', 
            type=str, 
            help="The ID of the project to migrate."
        )

        parser.add_argument(
            '--publication',
            action='store_true',
            help="Moves files to a published project location"
        )

        parser.add_argument(
            '--project',
            action='store_true',
            help="Moves files to a regular project location"
        )

    def handle(self, *args, **options):
        self.dry_run = options['dry_run']

        if not options['project'] and not options['publication']:
            print("Please specify either --project or --publication")
            return
        
        if options['project'] and options['publication']:
            print("Please specify either --project or --publication, not both")
            return
        
        self.publication = options['publication']
        self.project = options['project']

        if options['project_id']:
            projects = get_project_by_id(options['project_id'])
        elif self.publication:
            projects = query_published_projects()
        else:
            projects = query_projects()

        client = service_account()

        for project in projects:
            try:
                pub_id = f"{settings.PORTAL_PROJECTS_ID_PREFIX}-{project['id']}"
                project_prefix = settings.PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX if self.publication else settings.PORTAL_PROJECTS_SYSTEM_PREFIX
                project_id = f'{project_prefix}.{pub_id}'
                

                if self.publication:
                    pub = Publication.objects.get(project_id=pub_id)
                    project_graph = pub.tree
                else: 
                    project_graph = nx.node_link_data(_add_values_to_tree(project_id)) 

                file_mapping = {}

                for node in project_graph.get('nodes', []):
                    file_objs = node.get("value", {}).get("fileObjs", [])
                    for file_obj in file_objs: 
                        legacy_path = file_obj.get("legacyPath")
                        path = file_obj.get("path")
                        if legacy_path and path:
                            file_mapping[legacy_path] = path

                transfer_elements = []
                for legacy_path, new_path in file_mapping.items():

                    transfer_elements.append( 
                        {                       
                            'sourceURI': f'tapis://cloud.data/corral-repl/utexas/pge-nsf/media/{legacy_path.strip("/")}',
                            'destinationURI': f'tapis://{project_id}/{new_path.strip("/")}'
                        })
                    
                if not self.dry_run:
                    transfer = client.files.createTransferTask(elements=transfer_elements)
                    print(f"Transfer started for {len(file_mapping)} files: {transfer}")
                else: 
                    print(f"Dry run complete for project {project['id']} with {len(file_mapping)} files to transfer. No changes made.")
            except Exception as e:
                print(f"Error processing project {project['id']}: {e}")
                continue
