"""Canonical license-deed URLs for the publish form's fixed license `select`
field.

Shared between public_data/schema_org.py (schema.org/Croissant `license`) and
projects/workspace_operations/datacite_operations.py (DataCite `rightsList`)
so both resolve a publication's stored license selection to the same
canonical URL instead of maintaining two independently-drifting copies of
this mapping.
"""

from django.conf import settings

# The publication form's "license" field (the deployment's settings_forms.py,
# kept in Core-Portal-Deployments, e.g. digitalrocks/camino/settings_forms.py,
# not in this repo) is a fixed `select`, not free text, so its stored
# value should always be one of these known labels. schema.org/Croissant and
# DataCite's `rightsList` both expect a license URL (or, for schema.org, a
# CreativeWork), not a bare label, so map known labels to their canonical
# license-deed URL. These are the labels Core-Portal's own settings_forms.py
# offers; a portal whose form offers others adds them with
# PORTAL_PUBLICATION_LICENSE_URLS (and PORTAL_PUBLICATION_LICENSE_SPDX_IDS),
# which extend/override these. A label with no entry in either is logged and
# left out by callers (see public_data/schema_org.py's `_get_license` and
# datacite_operations.py's `_get_rights_list`) rather than silently passed
# through as non-conformant bare text.
LICENSE_URLS = {
    "ODC-BY 1.0": "https://opendatacommons.org/licenses/by/1-0/",
}

# SPDX License List identifiers (https://spdx.org/licenses/) for the same
# labels, for DataCite's `rightsIdentifier` (with rightsIdentifierScheme
# "SPDX"). Optional: a label with no entry here is just sent without one.
LICENSE_SPDX_IDS = {
    "ODC-BY 1.0": "ODC-By-1.0",
}

SPDX_SCHEME_URI = "https://spdx.org/licenses/"


def get_license_urls() -> dict[str, str]:
    """LICENSE_URLS, extended/overridden by the portal's PORTAL_PUBLICATION_LICENSE_URLS."""

    return {**LICENSE_URLS, **(getattr(settings, "PORTAL_PUBLICATION_LICENSE_URLS", None) or {})}


def get_license_spdx_ids() -> dict[str, str]:
    """LICENSE_SPDX_IDS, extended/overridden by the portal's PORTAL_PUBLICATION_LICENSE_SPDX_IDS."""

    return {**LICENSE_SPDX_IDS, **(getattr(settings, "PORTAL_PUBLICATION_LICENSE_SPDX_IDS", None) or {})}


def resolve_license_url(license_value: str | None) -> str | None:
    """Resolve a publish form's stored license selection to its canonical
    license-deed URL.

    A value that's already a URL is passed through as-is; a known label is
    mapped via get_license_urls(). Returns None for an empty/unset value *or*
    an unmapped label -- callers that need to distinguish "no license given"
    (fine, license is optional) from "a label with no mapping" (a
    misconfiguration worth logging) check `license_value` themselves.
    """

    if not license_value:
        return None
    if license_value.startswith("http://") or license_value.startswith("https://"):
        return license_value
    return get_license_urls().get(license_value)


def resolve_license_spdx_id(license_value: str | None) -> str | None:
    """Resolve a stored license selection -- a known label, or the canonical
    URL get_license_urls() maps one to -- to its SPDX identifier, or None when it
    has none.
    """

    if not license_value:
        return None
    spdx_ids = get_license_spdx_ids()
    if license_value in spdx_ids:
        return spdx_ids[license_value]
    for label, url in get_license_urls().items():
        if license_value == url:
            return spdx_ids.get(label)
    return None
