"""Helpers shared by the publish workflow and the public landing pages."""


def get_published_workspace_id(project_id, version):
    """Return the `{project_id}` / `{project_id}v{version}` id publish_project
    (project_publish_operations.py) gives a version's published workspace: the suffix of its Tapis
    system id, its directory under PORTAL_PROJECTS_PUBLISHED_ROOT_DIR, and its directory in the
    archive job's paths. Version 1 (or no version) has no suffix; every republish gets its own
    `v{version}` workspace.
    """

    suffix = f"v{version}" if version and version > 1 else ""
    return f"{project_id}{suffix}"
