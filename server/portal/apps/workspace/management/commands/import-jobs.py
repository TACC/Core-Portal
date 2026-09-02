from django.core.management import BaseCommand
from portal.libs.agave.utils import service_account
from django.contrib.auth import get_user_model
from portal.apps.workspace.models import JobSubmission
import dateutil.parser


class Command(BaseCommand):
    """
    This command imports the job histories for all existing users from the Agave
    tenant to the JobSubmission model. This populates the job history from the tenant
    as if this portal submitted them. (The originating portal cannot be determined
    from the tenant respnose.)
    """

    help = "Import all jobs from the tenant into JobSubmission history."

    def handle(self, *args, **options):
        agave = service_account()
        users = get_user_model().objects.all()
        print("Importing jobs for users...")
        for user in users:
            userjobs = list(JobSubmission.objects.filter(user=user))
            done = False
            offset = 0
            total = 0
            while not done:
                jobs = agave.jobs.list(query={"owner": user.username}, offset=offset, limit=100)
                for job in jobs:
                    if not any(existing.jobId == job["id"] for existing in userjobs):
                        job = JobSubmission.objects.create(
                            user=user,
                            jobId=job["id"],
                            time=dateutil.parser.parse(job["created"])
                        )
                offset += 100
                done = len(jobs) < 100
                total += len(jobs)
            print("{} jobs for {}".format(total, user.username))
