"""Normalization of stored ORCID iDs.

Shared between public_data/views.py (schema.org `creator.sameAs`) and
projects/workspace_operations/datacite_operations.py (DataCite
`creators.nameIdentifiers`), so both turn an author's `orcid_id` into the same
canonical URL, or both leave it out.

`orcid_id` reaches publication metadata from two places, in two different forms:
get_project_user copies the user's profile value, which comes from TAS
(auth/backends.py) unvalidated, and the publish form's AddOrcidModal checks the
format but accepts a lowercase "x". Values seen in practice include a bare iD,
an orcid.org URL, and an iD with no hyphens.
"""

import re

ORCID_URL_PREFIX = "https://orcid.org/"

# An optional orcid.org URL prefix (any scheme, optional "www."), then 16
# characters: 15 digits and a final digit or "X", hyphenated in groups of four
# or not hyphenated at all. Matched case-insensitively, then uppercased.
_ORCID_RE = re.compile(
    r"(?:(?:https?://)?(?:www\.)?orcid\.org/)?(\d{4})-?(\d{4})-?(\d{4})-?(\d{3}[\dX])/?",
    re.IGNORECASE,
)


def _checksum_char(base_digits: str) -> str:
    """ISO 7064 MOD 11-2 check character for an ORCID iD's first 15 digits
    (https://support.orcid.org/hc/en-us/articles/360006897674)."""

    total = 0
    for digit in base_digits:
        total = (total + int(digit)) * 2
    result = (12 - total % 11) % 11
    return "X" if result == 10 else str(result)


def normalize_orcid_id(value: str | None) -> str | None:
    """Return the canonical "0000-0002-1825-0097" form of a stored ORCID iD, or
    None if it's unset or not a valid iD (wrong shape, a URL on a host other than
    orcid.org, or a failed checksum). Invalid values are dropped, not passed
    through, so DataCite and the landing page never publish a malformed one."""

    match = _ORCID_RE.fullmatch((value or "").strip())
    if not match:
        return None
    orcid = "-".join(match.groups()).upper()
    digits = orcid.replace("-", "")
    if _checksum_char(digits[:15]) != digits[15]:
        return None
    return orcid


def orcid_url(value: str | None) -> str | None:
    """Canonical https://orcid.org/<iD> URL for a stored ORCID iD, or None. This
    is the form ORCID itself recommends displaying, and what both outputs use."""

    orcid = normalize_orcid_id(value)
    return f"{ORCID_URL_PREFIX}{orcid}" if orcid else None
