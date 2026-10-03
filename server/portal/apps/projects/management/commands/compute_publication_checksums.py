"""Management command."""

from django.core.management.base import BaseCommand, CommandError

from portal.apps.projects.workspace_operations.project_publish_operations import (
    _ARCHIVE_JOB_POLL_SECONDS,
    _get_published_workspace_id,
    archive_publication_files,
    load_publication_file_checksums,
    poll_publication_archive_job,
)
from portal.apps.publications.models import Publication


class Command(BaseCommand):
    """Compute and store sha256 checksums for published files

    publish_project does this automatically for new publications: the archive job hashes every file
    on the storage system and the portal loads its manifest. This backfills publications archived
    before the archive app wrote sha256 manifests (app < 0.0.3), or whose manifest wasn't loaded.

    By default each publication gets a checksum-only archive job (manifests only -- no ZIP, no Ranch
    transfer; needs archive app 0.0.3+), and its manifest is loaded when the job ends. --load-only
    skips the job and loads a manifest that already exists.

    Examples:

        Compute checksums for specific publications:

        >>> ./manage.py compute_publication_checksums DRP-1149 DRP-1152

        Compute checksums for every published publication:

        >>> ./manage.py compute_publication_checksums --all

        Load manifests that already exist, without submitting jobs:

        >>> ./manage.py compute_publication_checksums --all --load-only

        Show what would be done without doing it:

        >>> ./manage.py compute_publication_checksums --all --dry-run

    """

    help = "Compute (via checksum-only archive jobs) and store sha256 checksums for published files."

    def add_arguments(self, parser):
        parser.add_argument("project_ids", nargs="*", help="Publication project ids, e.g. DRP-1149.")
        parser.add_argument("--all", action="store_true", help="Every published publication.")
        parser.add_argument("--load-only", action="store_true", help="Load existing manifests; submit no jobs.")
        parser.add_argument("--dry-run", action="store_true", help="List publications without acting on them.")

    def handle(self, *args, **options):
        project_ids = options["project_ids"]
        if bool(project_ids) == options["all"]:
            raise CommandError("Pass either one or more project ids, or --all.")

        publications = Publication.objects.filter(is_published=True).order_by("project_id")
        if project_ids:
            publications = publications.filter(project_id__in=project_ids)
            missing = sorted(set(project_ids) - set(publications.values_list("project_id", flat=True)))
            if missing:
                raise CommandError(f"No published publication found for: {', '.join(missing)}")

        action = "Load manifest for" if options["load_only"] else "Submit checksum job for"
        for publication in publications:
            label = f"{publication.project_id} v{publication.version}"
            if options["dry_run"]:
                self.stdout.write(f"Would: {action} {label}")
                continue
            if options["load_only"]:
                load_publication_file_checksums.apply_async(args=[publication.project_id, publication.version])
            else:
                workspace_id = _get_published_workspace_id(publication.project_id, publication.version)
                try:
                    job = archive_publication_files(workspace_id, checksum_only=True)
                except ValueError as e:
                    raise CommandError(str(e)) from e
                poll_publication_archive_job.apply_async(
                    args=[job.uuid, publication.project_id, publication.version], countdown=_ARCHIVE_JOB_POLL_SECONDS
                )
            self.stdout.write(f"{action} {label}")
