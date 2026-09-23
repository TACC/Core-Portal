"""Canonical license-deed URLs for the publish form's fixed license `select` field.

Shared between public_data/views.py (schema.org/Croissant `license`) and
projects/workspace_operations/datacite_operations.py (DataCite `rightsList`) so both resolve a
publication's stored license selection to the same canonical URL instead of maintaining two
independently-drifting copies of this mapping.
"""

# The publication form's "license" field (settings_forms.py / dpmp.settings_forms.py) is a
# fixed `select`, not free text, so its stored value should always be one of these known
# labels. schema.org/Croissant and DataCite's `rightsList` both expect a license URL (or, for
# schema.org, a CreativeWork), not a bare label, so map known labels to their canonical
# license-deed URL. A label with no entry here is treated as a misconfiguration by callers
# (see public_data/views.py's `_get_license` and datacite_operations.py's `_get_rights_list`)
# rather than silently passed through as non-conformant bare text.
LICENSE_URLS = {
    "ODC-BY 1.0": "https://opendatacommons.org/licenses/by/1-0/",
}


def resolve_license_url(license_value: str | None) -> str | None:
    """Resolve a publish form's stored license selection to its canonical license-deed URL.

    A value that's already a URL is passed through as-is; a known label is mapped via
    LICENSE_URLS. Returns None for an empty/unset value *or* an unmapped label -- callers that
    need to distinguish "no license given" (fine, license is optional) from "a label with no
    LICENSE_URLS entry" (a misconfiguration worth failing loudly over) check `license_value`
    and `LICENSE_URLS` themselves; what counts as fatal differs by caller.
    """

    if not license_value:
        return None
    if license_value.startswith("http://") or license_value.startswith("https://"):
        return license_value
    return LICENSE_URLS.get(license_value)
