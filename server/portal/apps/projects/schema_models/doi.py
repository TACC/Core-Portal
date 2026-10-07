"""Normalization of DOIs entered for related publications.

Shared between public_data/views.py (schema.org `citation.identifier`) and
projects/workspace_operations/datacite_operations.py (DataCite
`relatedIdentifiers`), so both turn a stored `publicationDoi` into the same
bare DOI, or both leave it out.

The publish form takes the DOI as free text, so it arrives in whatever form
the author copied it: a bare "10.1234/abc", "doi:10.1234/abc", or a resolver
URL such as "https://doi.org/10.1234/abc". Used as-is, a URL form became
"https://doi.org/https://doi.org/..." in the landing page's JSON-LD, and a
non-DOI `relatedIdentifier` in DataCite.
"""

import re
from urllib.parse import unquote

DOI_URL_PREFIX = "https://doi.org/"

# An optional "doi:" label or doi.org / dx.doi.org resolver URL (any scheme,
# optional "www."), then the DOI itself: "10.", a registrant code (digits,
# optionally subdivided by dots, e.g. "10.1000.10"), "/" and a non-empty suffix
# with no whitespace.
_DOI_RE = re.compile(
    r"(?:doi:\s*|(?:https?://)?(?:www\.|dx\.)?doi\.org/)?(10\.\d+(?:\.\d+)*/\S+)",
    re.IGNORECASE,
)


def normalize_doi(value: str | None) -> str | None:
    """Return the bare "10.1234/abc" form of a stored DOI, or None if it's unset
    or isn't a DOI. A resolver URL's percent-encoding is decoded, since the DOI
    itself is the unencoded name."""

    value = (value or "").strip()
    match = _DOI_RE.fullmatch(value)
    if not match:
        return None
    doi = match.group(1)
    return unquote(doi) if "://" in value else doi


def doi_url(value: str | None) -> str | None:
    """Canonical https://doi.org/<DOI> URL for a stored DOI, or None."""

    doi = normalize_doi(value)
    return f"{DOI_URL_PREFIX}{doi}" if doi else None
