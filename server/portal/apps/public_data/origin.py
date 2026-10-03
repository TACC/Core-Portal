"""Public origin ("scheme://host") for published-dataset URLs.

Shared between public_data/views.py (landing-page canonical/JSON-LD/sitemap
URLs) and projects/workspace_operations/datacite_operations.py (the URL a DOI
is registered against), so a DOI can never resolve to a different host than
the one its landing page, canonical link and sitemap entry claim.
"""

from urllib.parse import urlsplit

from django.conf import settings


def get_configured_origin() -> str | None:
    """Return the origin of PORTAL_PUBLICATION_DATACITE_URL_PREFIX when it's an
    absolute URL, or None when it's unset or just a path -- callers decide
    their own fallback (the current request's host for views; VANITY_BASE_URL
    for the request-less DataCite publish task).
    """

    parsed = urlsplit(settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX or "")
    if parsed.scheme and parsed.netloc:
        return f"{parsed.scheme}://{parsed.netloc}"
    return None
