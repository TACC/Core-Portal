"""Helpers shared by the publish workflow and the public landing pages."""

from django.urls import reverse


def get_published_workspace_id(project_id, version):
    """Return the `{project_id}` / `{project_id}v{version}` id publish_project
    (project_publish_operations.py) gives a version's published workspace: the suffix of its Tapis
    system id, its directory under PORTAL_PROJECTS_PUBLISHED_ROOT_DIR, and its directory in the
    archive job's paths. Version 1 (or no version) has no suffix; every republish gets its own
    `v{version}` workspace.
    """

    suffix = f"v{version}" if version and version > 1 else ""
    return f"{project_id}{suffix}"


def get_archive_zip_path(workspace_id):
    """Return the path, relative to PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME (and so to its web
    mirror), of the whole-publication ZIP the archive job builds for a published workspace
    (get_published_workspace_id). Every file in it is under a top-level `{workspace_id}/` folder.
    """

    return f"archive/{workspace_id}/{workspace_id}_archive.zip"


def get_landing_page_path(project_id, version):
    """Return the landing-page path for a publication's current version: public_data/urls.py's
    `index` route at `{prefix}.{get_published_workspace_id(project_id, version)}`. The client app
    reads the published system id from this path, so it must name the version's own system: the
    bare `{prefix}.{project_id}` is version 1's system and would show version 1's files.
    """

    kwargs = {"project_id": project_id}
    if version and version > 1:
        kwargs["revision"] = version
    return reverse("publications:index", kwargs=kwargs)


def get_publication_file_objs(publication):
    """Every file object stored on a Publication: root-level `value.fileObjs` plus each entity
    node's `value.fileObjs` in `tree`, the networkx node_link_data that publish_project's
    _add_values_to_tree fills in. The returned dicts are the ones stored on the publication, so
    callers can update them in place. Not deduplicated: a path can appear more than once.
    """

    file_objs = list(publication.value.get("fileObjs") or [])
    for node in (publication.tree or {}).get("nodes", []):
        file_objs.extend((node.get("value") or {}).get("fileObjs") or [])
    return file_objs
