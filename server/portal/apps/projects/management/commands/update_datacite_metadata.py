"""Management command."""

import json

import networkx as nx
from django.core.management.base import BaseCommand, CommandError

from portal.apps.projects.workspace_operations.datacite_operations import get_datacite_json, upsert_datacite_json
from portal.apps.publications.models import Publication


class Command(BaseCommand):
    """Re-send DataCite metadata for publications that already have a DOI

    publish_project sends get_datacite_json's payload only when a publication is (re)published, so a
    DOI minted before that payload changed (e.g. before rightsList, subjects, creator `name` and ORCID
    nameIdentifiers were added) keeps its old metadata. This rebuilds the payload from each stored
    Publication, exactly as publish_project does, and updates the DOI in place. The DOI's state
    (draft/findable) isn't changed, and its publicationYear is left as originally registered.

    Examples:

        Update specific publications:
        >>> ./manage.py update_datacite_metadata DRP-1149 DRP-1152

        Update every published publication:
        >>> ./manage.py update_datacite_metadata --all

        Print the payload that would be sent, without sending it:
        >>> ./manage.py update_datacite_metadata --all --dry-run
    """

    help = "Re-send DataCite metadata for already-minted DOIs, rebuilt from the stored publications."

    def add_arguments(self, parser):
        parser.add_argument("project_ids", nargs="*", help="Publication project ids, e.g. DRP-1149.")
        parser.add_argument("--all", action="store_true", help="Every published publication.")
        parser.add_argument("--dry-run", action="store_true", help="Print each payload without sending it.")

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

        failed = []
        for publication in publications:
            label = f"{publication.project_id} v{publication.version}"
            doi = publication.value.get("doi")
            if not doi:
                self.stdout.write(f"Skipped {label}: no DOI")
                continue

            try:
                datacite_json = get_datacite_json(
                    nx.node_link_graph(publication.tree), publication.project_id, publication.version
                )
            except Exception as e:
                failed.append(publication.project_id)
                self.stderr.write(f"Failed {label} ({doi}): couldn't build its DataCite metadata: {e}")
                continue
            # upsert_datacite_json drops this for an update anyway; dropped here too so --dry-run prints
            # exactly what's sent.
            datacite_json.pop("publicationYear", None)

            if options["dry_run"]:
                self.stdout.write(f"Would update {doi} ({label}):\n{json.dumps(datacite_json, indent=2)}")
                continue

            # A rejected update (e.g. a 422 schema error) raises DataCiteError, with DataCite's own
            # error details in its message; a network failure raises a requests exception.
            try:
                upsert_datacite_json(datacite_json, doi=doi)
            except Exception as e:
                failed.append(publication.project_id)
                self.stderr.write(f"Failed {label} ({doi}): {e}")
                continue
            self.stdout.write(f"Updated {doi} ({label})")

        if failed:
            raise CommandError(f"{len(failed)} DOI(s) not updated: {', '.join(failed)}")
