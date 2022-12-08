from django.core.management import BaseCommand
from portal.libs.agave.utils import service_account
from django.contrib.auth import get_user_model
from portal.apps.workspace.models import JobSubmission
import dateutil.parser


class Command(BaseCommand):
    """
    This command imports the job histories for all existing users from the Agave
    tenant to the JobSubmission model. This populates the job history from the tenant
    as if this portal submitted them. This should be used once during the v2 to v3 transition
    and further removed once we drop support for historical v2 jobs.
    """

    help = "Import all v2 jobs from the tenant into JobSubmission history."

    def handle(self, *args, **options):
        tapis = service_account()
        users = get_user_model().objects.all()
        print("Importing v2 jobs...")
        for user in users:
            userjobs = list(JobSubmission.objects.filter(user=user))
            done = False
            offset = 0
            total = 0
            while not done:
                jobs = tapis.jobs.list(query={"owner": user.username}, offset=offset, limit=100)
                for job in jobs:
                    if not any(existing.jobId == job["id"] for existing in userjobs):
                        job = JobSubmission(
                            user=user,
                            jobId=job["id"],
                            time=dateutil.parser.parse(job["created"]),
                            data=job
                        )
                        job.save()
                offset += 100
                done = len(jobs) < 100
                total += len(jobs)
            print("{} jobs for {}".format(total, user.username))
