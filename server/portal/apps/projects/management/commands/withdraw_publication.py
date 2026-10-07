"""Management command."""

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from portal.apps.projects.workspace_operations.datacite_operations import hide_datacite_doi, publish_datacite_doi
from portal.apps.publications.models import Publication


class Command(BaseCommand):
    """Withdraw publications and hide their DataCite DOIs, or reverse that with --restore

    Withdrawing sets Publication.is_published to False, which drops the publication from the
    publications listing, search and the published-datasets sitemap, makes its files and cover image
    404, and leaves its landing page as a noindex tombstone (public_data/views.py). Then it sends
    DataCite the `hide` event, which moves the DOI from findable to registered: it still resolves to
    the tombstone page, but is no longer listed in DataCite's search or metadata feeds.

    --restore sets is_published back to True and sends the `publish` event, which makes the DOI
    findable again.

    The publication is withdrawn (or restored) even if DataCite rejects the request, so a failed
    DataCite call can be retried by running the same command again for the same project id. When
    DEBUG is set, publish_project never makes DOIs findable, so the DataCite call is skipped.

    Examples:

        Withdraw publications:
        >>> ./manage.py withdraw_publication DRP-1149 DRP-1152

        Reverse a withdrawal:
        >>> ./manage.py withdraw_publication --restore DRP-1149
    """

    help = "Withdraw publications and hide their DataCite DOIs, or reverse that with --restore."

    def add_arguments(self, parser):
        parser.add_argument("project_ids", nargs="+", help="Publication project ids, e.g. DRP-1149.")
        parser.add_argument(
            "--restore",
            action="store_true",
            help="Reverse a withdrawal: republish the publications and make their DOIs findable again.",
        )

    def handle(self, *args, **options):
        project_ids = options["project_ids"]
        restore = options["restore"]
        if restore:
            published, done, doi_action, doi_done, datacite_event = True, "Restored", "make findable", "Made", "publish"
            datacite_call = publish_datacite_doi
        else:
            published, done, doi_action, doi_done, datacite_event = False, "Withdrew", "hide", "Hid", "hide"
            datacite_call = hide_datacite_doi

        # Publications already in the target state are included, so a failed DataCite call can be
        # retried.
        publications = Publication.objects.filter(project_id__in=project_ids).order_by("project_id")
        missing = sorted(set(project_ids) - set(publications.values_list("project_id", flat=True)))
        if missing:
            raise CommandError(f"No publication found for: {', '.join(missing)}")

        failed = []
        for publication in publications:
            label = f"{publication.project_id} v{publication.version}"
            if publication.is_published != published:
                publication.is_published = published
                publication.save(update_fields=["is_published", "last_updated"])
                self.stdout.write(f"{done} {label}")
            else:
                self.stdout.write(f"{label} was already {'published' if published else 'withdrawn'}")

            doi = publication.value.get("doi")
            if not doi:
                self.stdout.write(f"Skipped DataCite {datacite_event} for {label}: no DOI")
                continue
            if settings.DEBUG:
                self.stdout.write(
                    f"Skipped DataCite {datacite_event} for {doi} ({label}): DEBUG is set, so DOIs aren't made findable"
                )
                continue

            # A rejected event (e.g. a DOI that's still a draft) raises DataCiteError, with DataCite's
            # own error details in its message; a network failure raises a requests exception.
            try:
                datacite_call(doi)
            except Exception as e:
                failed.append(publication.project_id)
                self.stderr.write(f"Failed to {doi_action} {doi} ({label}): {e}")
                continue
            self.stdout.write(f"{doi_done} {doi} {'findable ' if restore else ''}({label})")

        if failed:
            raise CommandError(
                f"{len(failed)} DOI(s) not updated at DataCite: {', '.join(failed)}. Their publications are "
                f"{'restored' if restore else 'withdrawn'}; rerun this command for them to retry."
            )
