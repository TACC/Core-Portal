import json
import logging
import re
from functools import partial
from io import StringIO

import networkx as nx
from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import transaction

from portal.apps.projects.models.project_metadata import ProjectMetadata
from portal.apps.projects.schema_models import constants
from portal.apps.projects.workspace_operations.datacite_operations import (
    get_datacite_json,
    get_datacite_url,
    publish_datacite_doi,
    upsert_datacite_json,
)
from portal.apps.projects.workspace_operations.graph_operations import remove_trash_nodes
from portal.apps.projects.workspace_operations.shared_workspace_operations import remove_user
from portal.apps.publications.models import Publication, PublicationRequest
from portal.apps.publications.utils import (
    get_archive_zip_path,
    get_publication_file_objs,
    get_published_workspace_id,
)
from portal.apps.search.tasks import index_publication
from portal.libs.agave.utils import service_account, user_account

logger = logging.getLogger(__name__)

# The archive job (PORTAL_PUBLICATION_ARCHIVE_APP_ID) hashes every published file on the storage
# system itself -- no file passes through the portal -- and writes `sha256sum` output here, relative
# to PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME. From app version 0.0.3 it's only written when every
# file hashed successfully, so a manifest that exists can be trusted in full.
_SHA256_MANIFEST_PATH = "archive/{workspace_id}/manifest-sha256.txt"

# From app version 0.0.3 the same job also writes its whole-publication ZIP's own sha256 (one
# `sha256sum` line) beside the ZIP (get_archive_zip_path) as `<ZIP name>.sha256`, only when every
# step building the ZIP succeeded.

# One `sha256sum` output line: hex digest, a space, a mode flag (" " text / "*" binary), then the
# path. GNU coreutils prefixes the line with "\\" when it had to escape a backslash/newline/CR in
# the path.
_SHA256_MANIFEST_LINE = re.compile(r"(\\?)([0-9a-fA-F]{64}) [ *](.+)")

# checksumOnly (manifests only; no ZIP, no Ranch transfer) only exists from archive app 0.0.3. An
# older app ignores the variable and re-runs the full archive, so it's refused below.
_CHECKSUM_ONLY_MIN_APP_VERSION = (0, 0, 3)

_TERMINAL_JOB_STATES = ("FINISHED", "CANCELLED", "FAILED")
_ARCHIVE_JOB_POLL_SECONDS = 60
# The archive app's own limit is 120 minutes (maxMinutes); this also allows for time queued.
_ARCHIVE_JOB_MAX_POLLS = 6 * 60


def _transfer_files(client, source_system_id, dest_system_id):

    service_client = service_account()

    source_system_files = client.files.listFiles(systemId=source_system_id, path="/")

    # Filter out the trash folder
    filtered_files = [file for file in source_system_files if file.name != settings.TAPIS_DEFAULT_TRASH_NAME]

    transfer_elements = [
        {"sourceURI": file.url, "destinationURI": f"tapis://{dest_system_id}/{file.path}"} for file in filtered_files
    ]

    transfer = service_client.files.createTransferTask(elements=transfer_elements)
    return transfer


def _transfer_cover_image(source_system_id, dest_system_id, cover_image_path):

    if not cover_image_path:
        logger.info("No cover image found for project, skipping transfer.")
        return None

    service_client = service_account()

    # Transfer the cover image to the destination system
    transfer_elements = [
        {
            "sourceURI": f"tapis://{source_system_id}/{cover_image_path}",
            "destinationURI": f"tapis://{dest_system_id}/{cover_image_path}",
        }
    ]

    transfer = service_client.files.createTransferTask(elements=transfer_elements)
    logger.info(f"Transfer task created for cover image: {transfer.uuid}")
    return transfer


def _check_transfer_status(service_client, transfer_task_id):
    transfer_details = service_client.files.getTransferTask(transferTaskId=transfer_task_id)
    return transfer_details.status


def _add_values_to_tree(project_id):
    project_meta = ProjectMetadata.get_project_by_id(project_id)
    prj_entities = ProjectMetadata.get_entities_by_project_id(project_id)

    entity_map = {entity.uuid: entity for entity in prj_entities}

    publication_tree: nx.DiGraph = nx.node_link_graph(project_meta.project_graph.value)

    publication_tree = remove_trash_nodes(publication_tree)

    for node_id in publication_tree:
        uuid = publication_tree.nodes[node_id]["uuid"]
        if uuid is not None:
            publication_tree.nodes[node_id]["value"] = entity_map[uuid].value
            publication_tree.nodes[node_id]["uuid"] = None  # Clear the uuid field

    return publication_tree


def publish_project_callback(
    review_project_id, published_project_id, archive_project_id, project_id=None, version=None
):
    service_client = service_account()
    try:
        update_and_cleanup_review_project(review_project_id, PublicationRequest.Status.APPROVED)
    except (ProjectMetadata.DoesNotExist, PublicationRequest.DoesNotExist):
        # poll_tapis_file_transfer retries this whole callback if a later step fails, and an earlier
        # attempt has already approved the request and deleted the review project. Every step below
        # is safe to repeat, so carry on rather than fail before the switch, DOI and archive steps.
        logger.warning(f"Review project {review_project_id} was already approved and cleaned up; continuing.")

    # Make system public for listing
    service_client.systems.shareSystemPublic(systemId=published_project_id)

    # The files are on the published system now, so the landing page and DOI can move to this
    # version without linking to files that 404. A transfer poll queued before this step existed (no
    # `project_id`) belongs to a publish_project that already did both itself. The landing page
    # becomes indexable once the DOI is findable -- right away under DEBUG, where DOIs stay drafts.
    if project_id and _switch_publication_to_version(project_id, version, published_project_id):
        if settings.DEBUG:
            _mark_publication_indexable(project_id, version)
        else:
            _queue_publish_publication_doi(project_id, version)

    # Create ZIP archive of published files (the same job writes the sha256 manifest)
    archive_job = archive_publication_files(archive_project_id)

    # `project_id`/`version` are absent for a transfer poll queued before this step existed -- that
    # publication can be backfilled with the compute_publication_checksums management command.
    if project_id:
        poll_publication_archive_job.apply_async(
            args=[archive_job.uuid, project_id, version], countdown=_ARCHIVE_JOB_POLL_SECONDS
        )


def _switch_publication_to_version(project_id, version, published_system_id):
    """Point the Publication row (the landing page, its file routes and the sitemap) and the search
    index at `version`, from the graph and metadata publish_project stored on that version's
    published system. Returns False, changing nothing, when a newer version is already live.
    """

    current = Publication.objects.filter(project_id=project_id).first()
    if current and version is not None and current.version > version:
        logger.warning(f"Not switching publication {project_id} to v{version}: v{current.version} is already live.")
        return False

    published_project = ProjectMetadata.get_project_by_id(published_system_id)
    publication_values = {
        "value": published_project.value,
        "tree": published_project.project_graph.value,
        "version": version,
        # The ZIP checksum belongs to the version it was computed for; this version's is loaded
        # once its archive job ends (load_publication_file_checksums).
        "archive_sha256": "",
        "archive_size": None,
    }
    Publication.objects.update_or_create(
        project_id=project_id,
        defaults=publication_values,
        # A first publish isn't indexable until its DOI is findable, so the landing page stays
        # noindex and out of the sitemap meanwhile. A republish keeps its is_indexable as it was:
        # its DOI already resolves.
        create_defaults={**publication_values, "is_indexable": False},
    )
    index_publication(project_id)
    logger.info(f"Publication {project_id} now serves v{version}.")
    return True


def _unescape_manifest_path(path):
    """Undo GNU `sha256sum`'s escaping of a path containing a backslash, newline or CR."""

    return re.sub(r"\\(.)", lambda m: {"n": "\n", "r": "\r"}.get(m.group(1), m.group(1)), path)


def _parse_sha256_manifest(content, workspace_id):
    """Map each file's path (relative to its published system, i.e. matching FileObj.path once
    stripped of slashes) to its lowercase hex sha256, from the archive job's manifest. Manifest
    paths are relative to the published root -- `{workspace_id}/<path>` -- so that prefix is
    removed; lines for any other directory, or that don't parse, are skipped.
    """

    prefix = f"{workspace_id}/"
    hashes = {}
    # split("\n"), not splitlines(): splitlines() also breaks on characters that are legal in
    # filenames (\x0b, \x1c, ...); real newlines in a path are escaped by sha256sum.
    for line in content.split("\n"):
        match = _SHA256_MANIFEST_LINE.fullmatch(line)
        if not match:
            continue
        escaped, digest, path = match.groups()
        if escaped:
            path = _unescape_manifest_path(path)
        if path.startswith(prefix):
            hashes[path[len(prefix) :]] = digest.lower()
    return hashes


def _read_sha256_manifest(workspace_id):
    """Fetch and parse a published workspace's sha256 manifest, or return None if there isn't one
    (archive app older than 0.0.3, a file failed to hash, or the job didn't get that far)."""

    path = _SHA256_MANIFEST_PATH.format(workspace_id=workspace_id)
    try:
        content = service_account().files.getContents(
            systemId=settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME, path=path
        )
    except Exception as e:
        logger.info(f"No sha256 manifest at {settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME}/{path}: {e}")
        return None
    return _parse_sha256_manifest(content.decode("utf-8", errors="replace"), workspace_id)


def _read_archive_checksum(workspace_id):
    """Return a published workspace's ZIP's (sha256, size in bytes), from the `.sha256` file the
    archive job writes beside it and a listing of the ZIP, or None if either is missing (archive
    app older than 0.0.3, the ZIP failed, or the job didn't get that far) or the file isn't one
    `sha256sum` line for that ZIP. The size is None when the listing doesn't report one.
    """

    system = settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME
    zip_path = get_archive_zip_path(workspace_id)
    client = service_account()
    try:
        content = client.files.getContents(systemId=system, path=f"{zip_path}.sha256")
        listing = client.files.listFiles(systemId=system, path=zip_path)
    except Exception as e:
        logger.info(f"No archive checksum for {system}/{zip_path}: {e}")
        return None
    match = _SHA256_MANIFEST_LINE.fullmatch(content.decode("utf-8", errors="replace").rstrip("\n"))
    if not match or match.group(1) or match.group(3) != zip_path.rsplit("/", 1)[-1]:
        logger.warning(f"Ignoring malformed archive checksum for {system}/{zip_path}.")
        return None
    size = getattr(listing[0], "size", None) if listing else None
    return match.group(2).lower(), size


@shared_task(bind=True, queue="default")
def load_publication_file_checksums(self, project_id: str, version: int | None = None):
    """Store each published file's sha256 -- read from the manifest the archive job computed on the
    storage system -- on its file object in Publication.value/tree (FileObj.sha256), so the landing
    page's Croissant `distribution` carries the per-file checksum Croissant requires (see
    public_data/schema_org.py's CROISSANT_FILE_CHECKSUM_FIELDS). Files missing from the manifest are
    left unhashed; the page then just omits conformsTo.

    Also stores the version's whole-publication ZIP's sha256 and size (Publication.archive_sha256
    and archive_size), which add the ZIP to the landing page's `distribution`.
    """

    publication = Publication.objects.get(project_id=project_id)
    version = version or publication.version
    workspace_id = get_published_workspace_id(project_id, version)
    hashes = _read_sha256_manifest(workspace_id)
    archive = _read_archive_checksum(workspace_id)
    if not hashes:
        logger.warning(
            f"No sha256 checksums available for publication {project_id} v{version}; its files stay "
            "unhashed (and its landing page without Croissant conformsTo) until the archive job's "
            "manifest exists -- see the compute_publication_checksums management command."
        )
    if not archive:
        logger.info(f"No archive checksum available for publication {project_id} v{version}.")
    if not hashes and not archive:
        return

    with transaction.atomic():
        publication = Publication.objects.select_for_update().get(project_id=project_id)
        # The manifest describes one version's files; don't attach it to a newer version's.
        if publication.version != version:
            logger.warning(
                f"Publication {project_id} is now v{publication.version}; discarding v{version}'s checksums."
            )
            return
        stored, unhashed = 0, set()
        for file_obj in get_publication_file_objs(publication) if hashes else []:
            path = (file_obj.get("path") or "").strip("/")
            if file_obj.get("type") != "file" or not path:
                continue
            if path in hashes:
                if file_obj.get("sha256") != hashes[path]:
                    file_obj["sha256"] = hashes[path]
                    stored += 1
            else:
                unhashed.add(path)
        update_fields = ["value", "tree"] if stored else []
        if archive and (publication.archive_sha256, publication.archive_size) != archive:
            publication.archive_sha256, publication.archive_size = archive
            update_fields += ["archive_sha256", "archive_size"]
        if update_fields:
            publication.save(update_fields=[*update_fields, "last_updated"])

    logger.info(f"Stored {stored} sha256 checksum(s) for publication {project_id} v{version}.")
    if unhashed:
        logger.warning(
            f"{len(unhashed)} file(s) of publication {project_id} v{version} aren't in its sha256 "
            f"manifest (e.g. {sorted(unhashed)[0]}) and stay unhashed."
        )


@shared_task(bind=True, queue="default")
def poll_publication_archive_job(self, job_uuid, project_id, version=None, attempt=1):
    """Wait for a publication's archive job to end, then load the sha256 manifest and ZIP
    checksum it wrote. Both are read whatever the job's final status: each is only written when
    its step fully succeeded, so either one that exists is trustworthy even when another step (or
    the Ranch transfer) failed.
    """

    try:
        status = service_account().jobs.getJobStatus(jobUuid=job_uuid).status
    except Exception as e:
        logger.warning(f"Could not get status of archive job {job_uuid} for publication {project_id}: {e}")
        status = None

    if status in _TERMINAL_JOB_STATES:
        if status != "FINISHED":
            logger.warning(f"Archive job {job_uuid} for publication {project_id} ended {status}.")
        load_publication_file_checksums(project_id, version)
        return

    if attempt >= _ARCHIVE_JOB_MAX_POLLS:
        logger.error(
            f"Gave up waiting for archive job {job_uuid} (last status {status}) for publication "
            f"{project_id}; load its checksums later with `compute_publication_checksums "
            f"--load-only {project_id}`."
        )
        return
    self.apply_async(
        args=[job_uuid, project_id, version], kwargs={"attempt": attempt + 1}, countdown=_ARCHIVE_JOB_POLL_SECONDS
    )


def publication_request_callback(
    user_access_token, source_workspace_id, review_workspace_id, source_system_id, review_system_id
):
    service_client = service_account()

    publication_reviewers = (
        get_user_model()
        .objects.filter(groups__name=settings.PORTAL_PUBLICATION_REVIEWERS_GROUP_NAME)
        .values_list("username", flat=True)
    )

    with transaction.atomic():
        # Commented out cleanup to prevent breaking admin role functionality
        # user_client.systems.unShareSystem(systemId=source_system_id, users=[portal_admin_username])
        # user_client.systems.revokeUserPerms(
        #     systemId=source_system_id, userName=portal_admin_username, permissions=["READ", "MODIFY", "EXECUTE"]
        # )
        # user_client.files.deletePermissions(systemId=source_system_id, username=portal_admin_username, path="/")
        # logger.info(f'Removed service account from workspace {source_workspace_id}')

        # Add reviewers to review workspace
        from portal.apps.projects.workspace_operations.shared_workspace_operations import add_user_to_workspace

        for reviewer in publication_reviewers:
            add_user_to_workspace(
                service_client,
                review_workspace_id,
                reviewer,
                "reader",
                f"{settings.PORTAL_PROJECTS_REVIEW_SYSTEM_PREFIX}.{review_workspace_id}",
                settings.PORTAL_PROJECTS_ROOT_REVIEW_SYSTEM_NAME,
            )
            logger.info(f"Added reviewer {reviewer} to review system {review_system_id}")

        if not settings.DEBUG:
            send_publication_in_review_email_to_authors.apply_async(args=[source_system_id])
            send_publication_submitted_for_review_email_to_reviewers.apply_async(args=[review_system_id])


def upload_metadata_file(project_id: str, project_json: str):
    """
    Upload the metadata file for a project. The uploaded file will appear at:
    tapis://{PUBLISHED_ROOT_SYSTEM}/archive/{PROJECT_ID}_metadata.json
    """
    published_root = settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME
    upload_name = f"{project_id}_metadata.json"
    upload_full_path = f"/archive/{project_id}/{upload_name}"
    client = service_account()
    client.files.mkdir(systemId=published_root, path=f"/archive/{project_id}")
    with StringIO() as f:
        json.dump(project_json, f, ensure_ascii=False, indent=4)
        f.seek(0)
        f.name = upload_name
        client.files.insert(systemId=published_root, path=upload_full_path, file=f)
    logger.debug("Created metadata file for %s at tapis://%s/%s", project_id, published_root, upload_full_path)


def archive_publication_files(project_id: str, checksum_only: bool = False, hash_archive: bool = False):
    """
    Run a Tapis job to create a ZIP archive of published files that includes metadata, plus the
    sha512/sha256 checksum manifests and the ZIP's own sha256. With `checksum_only`, the job writes
    the sha256 manifest only (no ZIP, no Ranch transfer) -- for backfilling checksums on an
    already-archived publication -- and, with `hash_archive` too, hashes the existing ZIP, which
    reads it once more. `hash_archive` has no effect without `checksum_only`.
    """

    if checksum_only:
        app_version = settings.PORTAL_PUBLICATION_ARCHIVE_APP_VERSION or ""
        try:
            supported = tuple(int(part) for part in app_version.split(".")) >= _CHECKSUM_ONLY_MIN_APP_VERSION
        except ValueError:
            supported = False
        if not supported:
            raise ValueError(
                f"Archive app version {app_version!r} doesn't support checksumOnly (needs "
                f"{'.'.join(map(str, _CHECKSUM_ONLY_MIN_APP_VERSION))}+) and would re-run the full "
                "archive and Ranch transfer instead."
            )

    client = service_account()
    published_root_system = settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME
    published_root_dir = client.systems.getSystem(systemId=published_root_system).rootDir

    job_body = {
        "name": f"{settings.PORTAL_NAMESPACE.lower()}-archive-publication-{project_id}",
        "appId": settings.PORTAL_PUBLICATION_ARCHIVE_APP_ID,
        "appVersion": settings.PORTAL_PUBLICATION_ARCHIVE_APP_VERSION,
        "description": f"Archive {settings.PORTAL_NAMESPACE} publication",
        "fileInputs": [],
        "parameterSet": {
            "appArgs": [],
            "schedulerOptions": [],
            "envVariables": [
                {"key": "publishedRootDir", "value": published_root_dir},
                {"key": "projectId", "value": project_id},
                {
                    "key": "ranchSystemId",
                    "value": settings.PORTAL_PUBLICATION_RANCH_SYSTEM_ID,
                },
                {
                    "key": "ranchArchiveRootDir",
                    "value": "/",
                },
                *([{"key": "checksumOnly", "value": "true"}] if checksum_only else []),
                *([{"key": "hashArchive", "value": "true"}] if checksum_only and hash_archive else []),
            ],
        },
        "tags": [f"portalName:{settings.PORTAL_NAMESPACE.lower()}"],
    }
    res = client.jobs.submitJob(**job_body)
    return res


@shared_task(bind=True, max_retries=3, queue="default")
def publish_project(self, project_id: str, version: int | None = 1):

    review_system_prefix = settings.PORTAL_PROJECTS_REVIEW_SYSTEM_PREFIX
    published_system_prefix = settings.PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX

    published_workspace_id = get_published_workspace_id(project_id, version)
    published_system_id = f"{published_system_prefix}.{published_workspace_id}"
    review_system_id = f"{review_system_prefix}.{project_id}"
    source_project_id = f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{project_id}"

    # A DOI DataCite created during this run that the source project doesn't record yet. Anything
    # failing after that point rolls back the transaction below, including the source project's
    # `doi` -- so it's saved again outside the transaction, and a retry updates this same draft DOI
    # instead of creating another one.
    new_doi = None
    try:
        with transaction.atomic():
            project_meta = ProjectMetadata.get_project_by_id(review_system_id)
            publication_tree: nx.DiGraph = nx.node_link_graph(project_meta.project_graph.value)

            publication_tree.nodes["NODE_ROOT"]["value"]["projectId"] = published_system_id

            published_project = ProjectMetadata.get_project_by_id(published_system_id)

            source_project = ProjectMetadata.get_project_by_id(source_project_id)
            # The first publish's date, kept on every republish so `datePublished`, the citation
            # date and DataCite's `Issued` date all stay the original; what changed in a republish
            # is carried by `version` and `dateModified` instead. It's written into the tree here so
            # get_datacite_json's Issued date reads it too. A publication made before that date was
            # stored has none, so its existing Publication row's `created` (its first publish) is
            # used; only a first publish falls back to this version's own system's `created`.
            existing_publication = Publication.objects.filter(project_id=project_id).first()
            publication_date = (
                source_project.value.get("publicationDate")
                or (existing_publication and existing_publication.created)
                or published_project.created
            )
            publication_tree.nodes["NODE_ROOT"]["value"]["publicationDate"] = publication_date

            try:
                # Mint a DataCite DOI
                existing_doi = source_project.value.get("doi", None)
                logger.info(f"Attempting to mint DataCite DOI for project {project_id}, existing DOI: {existing_doi}")

                if existing_doi and not settings.DEBUG:
                    # Nothing is sent yet, so the DOI keeps the live version's URL and metadata:
                    # publish_publication_doi sends this version's metadata, URL and the publish
                    # event together once its files are in place. Under DEBUG the DOI is never
                    # findable, so the draft is updated here instead.
                    doi = existing_doi
                    logger.info(f"Reusing DataCite DOI {doi} for project {project_id}; it's updated after transfer.")
                else:
                    datacite_json = get_datacite_json(publication_tree, project_id, version)
                    datacite_resp = upsert_datacite_json(datacite_json, doi=existing_doi)
                    doi = datacite_resp["data"]["id"]
                    if doi != existing_doi:
                        new_doi = doi
                    logger.info(f"Successfully minted DataCite DOI for project {project_id}: {doi}")
            except Exception as e:
                logger.error(f"Error minting DataCite DOI for project {project_id}: {e}")
                raise Exception(f"Error minting DOI for project {project_id}: {e}")

            # Update project metadata with datacite doi
            source_project.value["doi"] = doi
            source_project.value["publicationDate"] = publication_date
            source_project.save()

            publication_tree.nodes["NODE_ROOT"]["version"] = version
            publication_tree.nodes["NODE_ROOT"]["value"]["doi"] = doi
            # Stored on this version's published system, where _switch_publication_to_version reads
            # it once the files are in place.
            ProjectMetadata.objects.create(
                name=constants.PROJECT_GRAPH,
                base_project=published_project,
                value=nx.node_link_data(publication_tree),
            )
            published_project.value["doi"] = doi
            published_project.value["publicationDate"] = publication_date
            published_project.save()

            # The Publication row, search index and DOI aren't switched to this version here:
            # publish_project_callback does that once the file transfer below has completed, so
            # the landing page and DOI never point at files that aren't there yet.

            upload_metadata_file(published_workspace_id, nx.node_link_data(publication_tree))

            # transfer files
            client = service_account()
            transfer = _transfer_files(client, review_system_id, published_system_id)
            _transfer_cover_image(
                settings.PORTAL_PROJECTS_ROOT_REVIEW_SYSTEM_NAME,
                settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME,
                project_meta.value.get("coverImage", None),
            )

            # Queued on commit, so the callback (which reads the graph and DOI stored above) never
            # runs before they're committed, and a publish that rolls back queues nothing.
            transaction.on_commit(
                partial(
                    poll_tapis_file_transfer.apply_async,
                    args=(transfer.uuid, False),
                    kwargs={
                        "review_project_id": review_system_id,
                        "published_project_id": published_system_id,
                        "archive_project_id": published_workspace_id,
                        "project_id": project_id,
                        "version": version,
                    },
                    countdown=30,
                )
            )

            if not settings.DEBUG:
                transaction.on_commit(
                    partial(send_publication_accepted_email_to_authors.apply_async, args=[project_id])
                )
                transaction.on_commit(
                    partial(
                        send_publication_reviewed_email_to_reviewers.apply_async,
                        args=[project_id, "APPROVED", None],
                    )
                )
    except Exception:
        if new_doi:
            _record_minted_doi(source_project_id, new_doi)
        raise


def get_publish_doi_update(publication: Publication) -> tuple[str | None, dict | None]:
    """The `url` and `metadata` publish_datacite_doi should send with a publication's `publish`
    event: its live version's metadata, rebuilt from its tree (the metadata carries that version's
    URL), or that version's URL alone when the metadata can't be built.
    """

    project_id, version = publication.project_id, publication.version
    try:
        return None, get_datacite_json(nx.node_link_graph(publication.tree), project_id, version)
    except Exception:
        logger.exception(
            f"Could not build DataCite metadata for {project_id} v{version}; publishing its DOI with its URL "
            f"only. Run `update_datacite_metadata {project_id}` once the metadata is fixed."
        )
        return get_datacite_url(project_id, version), None


@shared_task(bind=True, max_retries=5, queue="default")
def publish_publication_doi(self, project_id: str, doi: str, version: int | None = None):
    """Make a publication's DOI findable at DataCite, then mark its landing page indexable. Queued by
    publish_project_callback once the publication's files have been transferred (see
    _queue_publish_publication_doi). The same request moves the DOI's URL to `version`'s landing
    page and sends that version's metadata, unless a newer version is live by now. Retried with
    backoff; once retries run out, `withdraw_publication --restore <project_id>` sends the same
    `publish` event, URL and metadata, and marks it indexable.
    """

    url = None
    metadata = None
    publication = (
        Publication.objects.filter(project_id=project_id, version=version).first() if version is not None else None
    )
    if publication:
        # Rebuilt from the version now live, so a republish's title, description and version
        # reach DataCite with its URL rather than while the old version is still served.
        url, metadata = get_publish_doi_update(publication)
    try:
        publish_datacite_doi(doi, url=url, metadata=metadata)
    except Exception as e:
        logger.error(
            f"Error publishing DataCite DOI {doi} for project {project_id} (attempt {self.request.retries + 1} of "
            f"{self.max_retries + 1}): {e}. If retries run out, run `withdraw_publication --restore {project_id}`."
        )
        raise self.retry(exc=e, countdown=60 * 2**self.request.retries)
    logger.info(f"DataCite DOI {doi} for project {project_id} is now findable.")
    _mark_publication_indexable(project_id, version)


def _mark_publication_indexable(project_id: str, version: int | None):
    """Let a publication's landing page be indexed and listed in the sitemap. Only for `version`, so a
    task from an earlier publish can't mark a newer republish indexable before its own files arrive.
    An update() rather than save(), so last_updated (the sitemap's <lastmod>) isn't changed.
    """

    publications = Publication.objects.filter(project_id=project_id, is_published=True)
    if version is not None:
        publications = publications.filter(version=version)
    if publications.update(is_indexable=True):
        logger.info(f"Publication {project_id} v{version} is now indexable.")
    else:
        logger.warning(
            f"Not marking publication {project_id} v{version} indexable: it's withdrawn, missing, or now a "
            "different version."
        )


def _queue_publish_publication_doi(project_id: str, version: int | None = None):
    """Queue publish_publication_doi for the DOI stored on the publication. Making a DOI findable
    can't be undone, so the DOI is read from the committed, published Publication row: a publish
    that rolled back (no row) or a withdrawn publication is left alone.
    """

    publication = Publication.objects.filter(project_id=project_id, is_published=True).first()
    doi = publication.value.get("doi") if publication else None
    if not doi:
        logger.error(
            f"Not making a DOI findable for project {project_id}: no published publication with a DOI. "
            f"If it should be findable, run `withdraw_publication --restore {project_id}`."
        )
        return
    publish_publication_doi.apply_async(args=[project_id, doi], kwargs={"version": version})


def _record_minted_doi(source_project_id: str, doi: str):
    """Save a DOI minted by a publish_project run that then failed onto the source project, so the
    next attempt finds it as `existing_doi` and updates it rather than minting a second one. Errors
    are logged, not raised, so they can't replace the exception that failed the publish.
    """

    try:
        source_project = ProjectMetadata.get_project_by_id(source_project_id)
        source_project.value["doi"] = doi
        source_project.save()
        logger.info(f"Saved DOI {doi} on {source_project_id} after a failed publish, for reuse on retry.")
    except Exception:
        logger.exception(f"Could not save DOI {doi} on {source_project_id}; a retry will mint a new one.")


@shared_task(bind=True, max_retries=3, queue="default")
def copy_graph_and_files_for_review_system(
    self, user_access_token, source_workspace_id, review_workspace_id, source_system_id, review_system_id
):
    logger.info(f"Starting copy task for system {source_system_id} to system {review_system_id}")

    with transaction.atomic():
        pub_tree = _add_values_to_tree(source_system_id)

        pub_tree.nodes["NODE_ROOT"]["value"]["projectId"] = review_system_id

        graph_model_value = nx.node_link_data(pub_tree)
        review_project = ProjectMetadata.get_project_by_id(review_system_id)

        ProjectMetadata.objects.update_or_create(
            name=constants.PROJECT_GRAPH,
            base_project=review_project,
            defaults={"value": graph_model_value},
        )

        client = user_account(user_access_token)
        transfer = _transfer_files(client, source_system_id, review_system_id)
        _transfer_cover_image(
            settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME,
            settings.PORTAL_PROJECTS_ROOT_REVIEW_SYSTEM_NAME,
            review_project.value.get("coverImage", None),
        )

        logger.info(f"Transfer task submmited with id {transfer.uuid}")

        poll_tapis_file_transfer.apply_async(
            args=(transfer.uuid, True),
            kwargs={
                "user_access_token": user_access_token,
                "source_workspace_id": source_workspace_id,
                "review_workspace_id": review_workspace_id,
                "source_system_id": source_system_id,
                "review_system_id": review_system_id,
            },
            countdown=30,
        )


@shared_task(bind=True, queue="default")
def poll_tapis_file_transfer(self, transfer_task_id, is_review, **kwargs):
    logger.info(f"Starting post transfer task for transfer id {transfer_task_id} with arguments: {kwargs}")

    try:
        service_client = service_account()

        # Check the transfer status
        transfer_status = _check_transfer_status(service_client, transfer_task_id)

        # Handle pending or in-progress transfer
        if transfer_status in ["PENDING", "IN_PROGRESS"]:
            logger.info(
                f"Transfer {transfer_task_id} is still pending with status {transfer_status}, retrying in 30 seconds."
            )
            self.apply_async(args=(transfer_task_id, is_review), kwargs=kwargs, countdown=30)
            return

        # Handle completed transfer
        elif transfer_status == "COMPLETED":
            logger.info(f"Transfer {transfer_task_id} completed successfully with arguments: {kwargs}")

            # Call the callback function with any passed arguments
            if is_review:
                publication_request_callback(**kwargs)
            else:
                publish_project_callback(**kwargs)

        else:
            logger.error(f"Error processing transfer {transfer_task_id}: Transfer status is {transfer_status}")
            raise Exception(f"Transfer {transfer_task_id} failed with status {transfer_status}")

    except Exception as e:
        logger.error(f"Error processing transfer {transfer_task_id} with arguments {kwargs}: {e}")
        self.retry(exc=e, countdown=30)


@transaction.atomic
def update_and_cleanup_review_project(review_project_id: str, status: PublicationRequest.Status):

    client = service_account()

    workspace_id = review_project_id.split(f"{settings.PORTAL_PROJECTS_REVIEW_SYSTEM_PREFIX}.")[1]

    # update the publication request
    review_project = ProjectMetadata.get_project_by_id(review_project_id)
    pub_request = PublicationRequest.objects.get(
        review_project=review_project, status=PublicationRequest.Status.PENDING
    )
    pub_request.status = status
    pub_request.save()

    logger.info(f"Updated publication request for review project {review_project_id} to {status}.")

    # delete the review project and data inside it
    reviewers = pub_request.reviewers.all()

    for reviewer in reviewers:
        try:
            remove_user(
                client,
                workspace_id,
                reviewer.username,
                review_project_id,
                settings.PORTAL_PROJECTS_ROOT_REVIEW_SYSTEM_NAME,
            )
            logger.info(f"Removed reviewer {reviewer.username} from review system {review_project_id}")
        except Exception:
            logger.error(f"Error removing reviewer {reviewer.username} from review system {review_project_id}")
            continue

    client.files.delete(systemId=review_project_id, path="/")
    client.systems.deleteSystem(systemId=review_project_id)
    review_project_graph = ProjectMetadata.objects.get(name=constants.PROJECT_GRAPH, base_project=review_project)
    review_project_graph.delete()
    review_project.delete()

    logger.info(f"Deleted review project {review_project_id} and its associated data.")


def get_project_user_emails(project_id):
    """Return a list of emails for users in a project."""
    prj = ProjectMetadata.get_project_by_id(project_id)
    return [user["email"] for user in prj.value["authors"] if user.get("email")]


def get_reviewer_emails():
    """Return a list of emails for reviewers."""
    reviewers = get_user_model().objects.filter(groups__name=settings.PORTAL_PUBLICATION_REVIEWERS_GROUP_NAME)
    return [reviewer.email for reviewer in reviewers if reviewer.email]


@shared_task(bind=True, queue="default")
def send_publication_accepted_email_to_authors(self, project_id):
    """
    Alert project authors that their request has been accepted.
    """
    user_emails = get_project_user_emails(project_id)
    for user_email in user_emails:
        email_body = f"""
            <p>Hello,</p>
            <p>
                Congratulations! The following project has been accepted for publication:
                <br/>
                <b>{project_id}</b>
                <br/>
            </p>
            <p>
            Your publication should appear in the portal within 1 business day.
            </p>

            This is a programmatically generated message. Do NOT reply to this message.
            """

        send_mail(
            f"{settings.PORTAL_PUBLICATION_PUBLISHER} Alert: Your Publication Request has been Accepted",
            email_body,
            settings.DEFAULT_FROM_EMAIL,
            [user_email],
            html_message=email_body,
        )


@shared_task(bind=True, queue="default")
def send_publication_rejected_email_to_authors(self, project_id: str):
    """
    Alert project authors that their request has been rejected.
    """
    user_emails = get_project_user_emails(project_id)
    for user_email in user_emails:
        email_body = f"""
            <p>Hello,</p>
            <p>
                The following dataset has received a revision request:
                <br/>
                <b>{project_id}</b>
                <br/>
            </p>
            <p>
            You are welcome to revise this dataset and re-submit for publication.
            </p>

            This is a programmatically generated message. Do NOT reply to this message.
            """

        send_mail(
            f"{settings.PORTAL_PUBLICATION_PUBLISHER} Alert: Your Dataset needs revision",
            email_body,
            settings.DEFAULT_FROM_EMAIL,
            [user_email],
            html_message=email_body,
        )


@shared_task(bind=True, queue="default")
def send_publication_in_review_email_to_authors(self, project_id):
    """
    Alert dataset authors that their dataset is in review.
    """
    user_emails = get_project_user_emails(project_id)

    logger.info(f"Sending publication review email to {user_emails}")

    for user_email in user_emails:
        email_body = f"""
            <p>Hello,</p>
            <p>
                Your dataset is currently in review.
                <br/>
                <b>{project_id}</b>
                <br/>
            </p>
            <p>
            You will be notified when the review is complete.
            </p>

            This is a programmatically generated message. Do NOT reply to this message.
            """

        send_mail(
            f"{settings.PORTAL_PUBLICATION_PUBLISHER} Alert: Your Dataset is in Review",
            email_body,
            settings.DEFAULT_FROM_EMAIL,
            [user_email],
            html_message=email_body,
        )


@shared_task(bind=True, queue="default")
def send_publication_reviewed_email_to_reviewers(self, project_id, status, reviewer):
    """
    Alert dataset reviewers that a dataset has received feedback.
    """
    reviewer_emails = get_reviewer_emails()

    if status == PublicationRequest.Status.REJECTED:
        status = "Revision Required"

    logger.info(f"Sending reviewer notification email to {reviewer_emails}")

    for reviewer_email in reviewer_emails:
        email_body = f"""
            <p>Hello,</p>
            <p>
                The dataset {project_id} has received a review from {reviewer}:
                <br/>
                <b>Feedback: {status}</b>
                <br/>
            </p>

            This is a programmatically generated message. Do NOT reply to this message.
            """

        send_mail(
            f"{settings.PORTAL_PUBLICATION_PUBLISHER} Alert: A Dataset has Received Review",
            email_body,
            settings.DEFAULT_FROM_EMAIL,
            [reviewer_email],
            html_message=email_body,
        )


@shared_task(bind=True, queue="default")
def send_publication_submitted_for_review_email_to_reviewers(self, project_id):
    """
    Alert dataset reviewers that a dataset has been submitted for review.
    """
    reviewer_emails = get_reviewer_emails()

    logger.info(f"Sending reviewer notification email to {reviewer_emails}")

    for reviewer_email in reviewer_emails:
        email_body = f"""
            <p>Hello,</p>
            <p>
                A new dataset has been submitted for review:
                <br/>
                <b>{project_id}</b>
                <br/>
            </p>
            <p>
            Please review the dataset and approve or reject it.
            </p>

            This is a programmatically generated message. Do NOT reply to this message.
            """

        send_mail(
            f"{settings.PORTAL_PUBLICATION_PUBLISHER} Alert: A New Dataset has been Submitted for Review",
            email_body,
            settings.DEFAULT_FROM_EMAIL,
            [reviewer_email],
            html_message=email_body,
        )
