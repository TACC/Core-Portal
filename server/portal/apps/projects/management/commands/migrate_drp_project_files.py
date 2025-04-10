from django.core.management.base import BaseCommand
from django.conf import settings
import networkx as nx
from pathlib import Path
from portal.apps.projects.migration_utils.sql_db_utils import get_project_by_id, query_projects, query_published_projects
from portal.apps.publications.models import Publication
from portal.libs.agave.utils import service_account
from portal.apps.projects.workspace_operations.project_publish_operations import _add_values_to_tree
import time

TRANSFER_STATUS_CHECK_INTERVAL = 60

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
            nargs='+',
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

        parser.add_argument(
            '--batch-size',
            type=int,
            default=10,
            help="Number of projects to process in each batch. Default is 10.",
        )
    
    def transfer_cover_image(self, client, workspace_id, cover_pic):
        root_system = settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME if self.publication else settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME
        cover_image_transfer_elements = [{
            'sourceURI': f'tapis://cloud.data/corral-repl/utexas/pge-nsf/media/{cover_pic.strip("/")}',
            'destinationURI': f'tapis://{root_system}/media/{workspace_id}/cover_image/{Path(cover_pic).name}'
        }]
        cover_image_transfer = client.files.createTransferTask(elements=cover_image_transfer_elements)
        print(f"Cover image transfer started: {cover_image_transfer}")


    def handle(self, *args, **options):
        self.dry_run = options['dry_run']
        BATCH_SIZE = options['batch_size']

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


        for i in range(0, len(projects), BATCH_SIZE):
            batch = projects[i:i+BATCH_SIZE]
            transfer_ids = []

            print('#' * 40)
            print('')
            print(f"Processing batch {i//BATCH_SIZE + 1}/{len(projects)//BATCH_SIZE + 1}")
            print(f"Processing project IDs: {', '.join([str(project['id']) for project in batch])}")

            for project in batch:
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
                        
                    if project["cover_pic"]:
                        cover_pic = project["cover_pic"]
                        root_system = settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME if self.publication else settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME
                        transfer_elements.append({
                            'sourceURI': f'tapis://cloud.data/corral-repl/utexas/pge-nsf/media/{cover_pic.strip("/")}',
                            'destinationURI': f'tapis://{root_system}/media/{pub_id}/cover_image/{Path(cover_pic).name}'
                        })

                    if not self.dry_run:
                        client = service_account()
                        transfer = client.files.createTransferTask(elements=transfer_elements)
                        transfer_ids.append({"project_id": project["id"], "transfer_id": transfer.uuid})

                        print('#' * 40)
                        print('')
                        print(f"Transfer started for project {project['id']} with {len(file_mapping)} files")
                        print(f"Transfer UUID: {transfer.uuid}")
                        print('')
                    else:
                        print(f"Dry run complete for project {project['id']} with {len(file_mapping)} files to transfer. No changes made.")

                except Exception as e:
                    print(f"Error processing project {project['id']}: {e}")
                    continue
            
            print(f'End of batch {i//BATCH_SIZE + 1}/{len(projects)//BATCH_SIZE + 1}')
            print('')
            print('#' * 40)

            if not self.dry_run:
                completed_transfers, failed_transfers = self.monitor_transfers(transfer_ids)
                print(f"Completed transfers: {completed_transfers}")
                print(f"Failed transfers: {failed_transfers}")
                
    def monitor_transfers(self, transfer_ids):
        client = service_account()

        completed_transfers = []
        failed_transfers = []

        while (len(completed_transfers) + len(failed_transfers)) < len(transfer_ids):
            for transfer in transfer_ids:
                project_id = transfer["project_id"]
                transfer_id = transfer["transfer_id"]


                if any(transfer_id == t["transfer_id"] for t in completed_transfers + failed_transfers):
                    continue
                
                transfer_details = client.files.getTransferTask(transferTaskId=transfer_id)
                status = transfer_details.status

                if status == "COMPLETED":
                    print(f"Transfer completed for project {project_id}.")
                    completed_transfers.append({"project_id": project_id, "transfer_id": transfer_id})

                elif status in ["FAILED", "CANCELED", "FAILED_OPT", "PAUSED"]:
                    print(f"Transfer failed for project {project_id}.")
                    failed_transfers.append({"project_id": project_id, "transfer_id": transfer_id})
            
            time.sleep(TRANSFER_STATUS_CHECK_INTERVAL)

        return completed_transfers, failed_transfers
