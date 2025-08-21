from django.core.management.base import BaseCommand
from portal.apps.projects.workspace_operations.project_publish_operations import archive_publication_files, upload_metadata_file
from portal.apps.publications.models import Publication
from portal.libs.agave.utils import service_account
import time
from django.db import close_old_connections

class Command(BaseCommand):
    help = "Archive Digital Porous Media publications."

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
            help="Specify a project ID to archive."
        )

        parser.add_argument(
            '--skip-projects',
            type=str,
            nargs='+',
            help="Specify project IDs to skip during the archiving process."
        )

        parser.add_argument(
            '--batch-size',
            type=int,
            default=10,
            help="Number of projects to process in each batch. Default is 10.",
        )

        parser.add_argument(
            '--batch-skip',
            type=int,
            default=0,
            help="Number of batches to skip before starting processing.",
        )

        parser.add_argument(
            '--status-check-interval',
            type=int,
            default=60,
            help="Interval in seconds to check transfer status. Default is 60 seconds.",
        )

    def handle(self, *args, **options):

        BATCH_SIZE = options['batch_size']
        BATCH_SKIP = options['batch_skip']
        STATUS_CHECK_INTERVAL = options['status_check_interval']

        publications = []

        if options['project_id']:
            publications = list(Publication.objects.filter(project_id__in=options['project_id']))
        else: 
            publications = list(Publication.objects.all())

        if options['skip_projects']:
            publications = [pub for pub in publications if pub.project_id not in options['skip_projects']]

        print(f'Found {len(publications)} publications to archive.')

        for i in range(BATCH_SKIP * BATCH_SIZE, len(publications), BATCH_SIZE):
            batch = publications[i:i + BATCH_SIZE]
            job_ids = []

            print('#' * 40)
            print('')
            print(f"Processing batch {i//BATCH_SIZE + 1}/{len(publications)//BATCH_SIZE + 1}")
            print(f"Processing project IDs: {', '.join([str(pub.project_id) for pub in batch])}")

            for pub in batch:
                try:
                    close_old_connections()

                    project_id = pub.project_id
                    upload_metadata_file(project_id, pub.tree)
                    job_res = archive_publication_files(project_id)
                    job_ids.append({'job_id': job_res.uuid, 'project_id': project_id})

                    print('#' * 40)
                    print('')
                    print(f'Submitted archive files job for publication id {project_id}')
                    print(f"Job UUID: {job_res.uuid}")
                    print('')
                except Exception as e:
                    print(f"Error processing publication {project_id}: {e}")
                    continue

            print(f'End of batch {i//BATCH_SIZE + 1}/{len(publications)//BATCH_SIZE + 1}')
            print('')
            print('#' * 40)

            print(f'Starting transfer monitoring with interval {STATUS_CHECK_INTERVAL} seconds')
            completed_jobs, failed_jobs = self.monitor_jobs(job_ids, STATUS_CHECK_INTERVAL)
            print(f"Completed jobs: {completed_jobs}")
            print(f"Failed transfers: {failed_jobs}")
    
    def monitor_jobs(self, job_ids, status_check_interval):
        completed_jobs = []
        failed_jobs = []

        while (len(completed_jobs) + len(failed_jobs)) < len(job_ids):
            client = service_account()

            for job in job_ids:
                project_id = job['project_id']
                job_id = job['job_id']

                if any(job_id == t["job_id"] for t in completed_jobs + failed_jobs):
                    continue

                job_res = client.jobs.getJobStatus(jobUuid=job_id)
                status = job_res.status

                if status == 'FINISHED':
                    completed_jobs.append(job)
                    print(f'Job {job_id} for project {project_id} completed successfully.')
                elif status in ['FAILED', 'CANCELLED', 'PAUSED', 'BLOCKED']:
                    failed_jobs.append(job)
                    print(f'Job {job_id} for project {project_id} failed with status {status}.')

            if (len(completed_jobs) + len(failed_jobs)) < len(job_ids):
                time.sleep(status_check_interval)

        return completed_jobs, failed_jobs