"""Management command."""

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from portal.apps.projects.models.project_metadata import ProjectMetadata
from portal.apps.projects.schema_models import constants
from portal.apps.projects.schema_models.license_urls import resolve_license_url
from portal.apps.projects.workspace_operations.project_publish_operations import write_publication_croissant
from portal.apps.publications.models import Publication
from portal.apps.publications.utils import get_published_workspace_id
from portal.apps.search.tasks import index_publication

DEFAULT_LICENSE = "ODC-BY 1.0"


def _root_value(tree):
    """The NODE_ROOT node's `value` in a node_link_data graph, or None when it has none."""

    for node in (tree or {}).get("nodes", []):
        if node.get("id") == "NODE_ROOT":
            return node.get("value")
    return None


def _license_of(value):
    return ((value or {}).get("license") or "").strip()


class Command(BaseCommand):
    """Backfill a license on published projects that have none

    schema.org's Dataset and Croissant (mlcroissant) require `license`, as a license-deed URL
    (REQUIRED_CROISSANT_FIELDS), so a publication without one is emitted without `license` or
    `conformsTo`, and gets no static croissant.json. Publishing now requires a license where the form
    does (is_publication_license_required), but projects published before that may have none.

    A publication counts as missing one when its stored metadata (`value`, which the landing page's
    JSON-LD reads) or its tree's root (which the search index reads) has no license. The license
    given to it is, in order: the one already on the other of those two, the source project's (when
    it resolves to a URL), or --license (default "ODC-BY 1.0", which must resolve to a URL). It's
    written to every copy that has none: the Publication's value and tree, the live version's
    published-system metadata and graph, and the source project, so a later republish keeps it. A
    copy that already has a license is never changed. A publication whose license is a label with no
    license-deed URL isn't missing one, so isn't changed either: it's reported, to be mapped in
    PORTAL_PUBLICATION_LICENSE_URLS.

    Each updated publication is reindexed and has its croissant.json rewrite queued. DataCite's
    rightsList isn't sent: run update_datacite_metadata on the updated publications afterwards.

    Examples:

        Backfill specific publications:

        >>> ./manage.py backfill_project_license DRP-1149 DRP-1152

        Backfill every published publication:

        >>> ./manage.py backfill_project_license --all

        Backfill with a license other than the default:

        >>> ./manage.py backfill_project_license --all --license "CC BY 4.0"

        Show what would be changed without changing it:

        >>> ./manage.py backfill_project_license --all --dry-run

    """

    help = "Backfill a license on published projects that have none, so their metadata conforms to Croissant."

    def add_arguments(self, parser):
        parser.add_argument("project_ids", nargs="*", help="Publication project ids, e.g. DRP-1149.")
        parser.add_argument("--all", action="store_true", help="Every published publication.")
        parser.add_argument(
            "--license",
            default=DEFAULT_LICENSE,
            help=f'License label (or URL) for publications with none to inherit. Default "{DEFAULT_LICENSE}".',
        )
        parser.add_argument("--dry-run", action="store_true", help="List the changes without making them.")

    def handle(self, *args, **options):
        project_ids = options["project_ids"]
        if bool(project_ids) == options["all"]:
            raise CommandError("Pass either one or more project ids, or --all.")

        default_license = options["license"].strip()
        if not resolve_license_url(default_license):
            raise CommandError(
                f"--license {default_license!r} has no license-deed URL (projects/schema_models/license_urls.py "
                "or PORTAL_PUBLICATION_LICENSE_URLS), so it wouldn't conform to schema.org/Croissant."
            )

        publications = Publication.objects.filter(is_published=True).order_by("project_id")
        if project_ids:
            publications = publications.filter(project_id__in=project_ids)
            missing = sorted(set(project_ids) - set(publications.values_list("project_id", flat=True)))
            if missing:
                raise CommandError(f"No published publication found for: {', '.join(missing)}")

        updated = []
        unmapped = []
        failed = []
        for publication in publications:
            label = f"{publication.project_id} v{publication.version}"
            try:
                changes = self._backfill(publication, default_license, options["dry_run"])
            except Exception as e:
                failed.append(publication.project_id)
                self.stderr.write(f"Failed {label}: {e}")
                continue

            if changes is None:
                unmapped.append(publication.project_id)
                self.stderr.write(
                    f"Skipped {label}: its license "
                    f"{_license_of(publication.value) or _license_of(_root_value(publication.tree))!r} has no "
                    "license-deed URL; "
                    "add one to PORTAL_PUBLICATION_LICENSE_URLS."
                )
                continue
            if not changes:
                self.stdout.write(f"Skipped {label}: already has a license")
                continue

            updated.append(publication.project_id)
            verb = "Would set" if options["dry_run"] else "Set"
            for where, license_value in changes:
                self.stdout.write(f"{verb} license {license_value!r} on {where} ({label})")

        self.stdout.write(
            f"{len(updated)} publication(s) {'would be ' if options['dry_run'] else ''}updated"
            + (f", {len(unmapped)} with an unmapped license" if unmapped else "")
            + "."
        )
        if updated and not options["dry_run"]:
            self.stdout.write(
                "DataCite isn't updated by this command; to send the license to DataCite, run: "
                f"./manage.py update_datacite_metadata {' '.join(updated)}"
            )
        if failed:
            raise CommandError(f"{len(failed)} publication(s) not updated: {', '.join(failed)}")

    def _backfill(self, publication, default_license, dry_run):
        """Give every copy of `publication`'s metadata that has no license the one it should have.
        Returns the (copy, license) pairs set (or, under dry_run, that would be), [] when nothing is
        missing, or None when its license is a label with no license-deed URL.
        """

        pub_root = _root_value(publication.tree)
        pub_license = _license_of(publication.value) or _license_of(pub_root)
        if pub_license and not resolve_license_url(pub_license):
            return None

        source_project = _get_project(f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{publication.project_id}")
        published_project = _get_project(
            f"{settings.PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX}."
            f"{get_published_workspace_id(publication.project_id, publication.version)}"
        )

        source_license = _license_of(source_project.value) if source_project else ""
        license_value = (
            pub_license or (source_license if resolve_license_url(source_license) else "") or default_license
        )

        # (description, metadata dict to set it on, model instance to save)
        targets = [("publication metadata", publication.value, publication)]
        if pub_root is not None:
            targets.append(("publication tree", pub_root, publication))
        if published_project:
            targets.append(("published project", published_project.value, published_project))
            graph = ProjectMetadata.objects.filter(name=constants.PROJECT_GRAPH, base_project=published_project).first()
            graph_root = _root_value(graph.value) if graph else None
            if graph_root is not None:
                targets.append(("published project graph", graph_root, graph))
        if source_project:
            targets.append(("source project", source_project.value, source_project))

        targets = [target for target in targets if not _license_of(target[1])]
        changes = [(where, license_value) for where, _, _ in targets]
        if dry_run or not targets:
            return changes

        # The publication's value and tree are one row, so each instance is saved once.
        to_save = {}
        for _, value, instance in targets:
            value["license"] = license_value
            to_save[id(instance)] = instance
        with transaction.atomic():
            for instance in to_save.values():
                instance.save()
            if id(publication) in to_save:
                project_id, version = publication.project_id, publication.version
                transaction.on_commit(lambda: self._refresh(project_id, version))
        return changes

    def _refresh(self, project_id, version):
        """Reindex the publication and queue its croissant.json rewrite, now that it has a license."""

        try:
            index_publication(project_id)
        except Exception as e:
            self.stderr.write(f"Couldn't reindex {project_id}: {e}")
        write_publication_croissant.apply_async(args=[project_id, version])


def _get_project(system_id):
    """The base project metadata for `system_id`, or None when there's none (e.g. in copied data)."""

    return ProjectMetadata.objects.filter(name=constants.PROJECT, value__projectId=system_id).first()
