"""Normalization of stored publication keywords.

Shared between public_data/views.py (schema.org `keywords` and the `keywords` meta tag) and
projects/workspace_operations/datacite_operations.py (DataCite `subjects`), so all three publish
the same keyword list.

`keywords` (base_metadata.py) is typed `str | list[str] | None` and is stored either way: a
free-text "text" form field saves one comma-separated string, while the deployed DPMP form's
"tags" field saves a list. List entries can still carry stray whitespace (e.g. " two").
"""


def normalize_keywords(keywords: str | list[str] | None) -> list[str]:
    """Return the stored keywords as a list of trimmed, non-empty strings. A string is split on
    ","; a list is used as-is."""

    keywords = keywords or []
    if isinstance(keywords, str):
        keywords = keywords.split(",")
    return [keyword.strip() for keyword in keywords if keyword.strip()]
