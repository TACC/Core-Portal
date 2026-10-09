"""Citations for a publication's landing page: the APA and BibTeX citations of the dataset
itself, the related works it recommends citing, and the values of its Google Scholar
(citation_*) tags.
"""

import mimetypes
import re
import unicodedata

from django.conf import settings

from portal.apps.projects.schema_models.doi import doi_url, normalize_doi
from portal.apps.public_data.links import get_landing_page_url, get_publication_file_url

# Characters that are special to (La)TeX inside a BibTeX field value, and how to write each one
# literally, so a title like "Pores & 50% porosity" can't break the entry or the document citing it.
_BIBTEX_ESCAPES = str.maketrans(
    {
        "\\": r"\textbackslash{}",
        "{": r"\{",
        "}": r"\}",
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "~": r"\textasciitilde{}",
        "^": r"\textasciicircum{}",
    }
)


def _format_apa_author(author):
    """Format one author as "Family, G." -- the APA form DataCite's own citation formatter uses --
    with an initial for each given name, keeping hyphens ("Jean-Paul" -> "J.-P.")."""

    initials = [
        "-".join(f"{part[0]}." for part in name.split("-") if part) for name in (author.get("first_name") or "").split()
    ]
    initials = " ".join(initial for initial in initials if initial)
    return f"{author['last_name'].strip()}, {initials}" if initials else author["last_name"].strip()


def _end_sentence(text):
    """`text` ending in exactly one sentence-ending mark, so a title or name that already ends in
    one doesn't get a second period."""

    return text if text.endswith((".", "?", "!")) else f"{text}."


def get_apa_citation(base_meta, doi, project_id, version, request):
    """Build a plain-text citation for the landing page's visible summary, following DataCite's
    recommended citation format (Creator(s) (PublicationYear). Title. Publisher. Identifier),
    in the APA style DataCite's own citation formatter produces -- e.g. "Lovelace, A., & Turing, A.
    (2024). Title. Publisher. https://doi.org/..." -- from metadata already available on the
    publication so it can't go stale like a hand-written placeholder would. Authors without a last
    name are left out.
    """

    author_names = [
        _format_apa_author(author) for author in base_meta.get("authors", []) if (author.get("last_name") or "").strip()
    ]
    if len(author_names) > 1:
        author_names = [f"{', '.join(author_names[:-1])}, & {author_names[-1]}"]

    publication_date = base_meta.get("publicationDate") or base_meta.get("publication_date") or ""
    year = publication_date[:4] if publication_date else ""

    identifier = doi_url(doi) or get_landing_page_url(project_id, version, request)

    creator_and_year = " ".join([*author_names, *([f"({year})"] if year else [])])
    sentences = [creator_and_year, base_meta.get("title"), settings.PORTAL_PUBLICATION_PUBLISHER]
    # The identifier is a URL, so it isn't followed by a period.
    return " ".join([*(_end_sentence(part.strip()) for part in sentences if part and part.strip()), identifier])


def _bibtex_value(text):
    """`text` as one BibTeX field value: whitespace (including newlines) collapsed, and TeX's
    special characters escaped (_BIBTEX_ESCAPES)."""

    return " ".join(str(text).split()).translate(_BIBTEX_ESCAPES)


def _bibtex_verbatim(text):
    """`text` (a DOI or URL) as a verbatim BibTeX field, which biblatex and the url package read as
    is -- so nothing is escaped, but braces and backslashes, which would still end the field early,
    are dropped. Neither appears in a real DOI or in the URLs built here."""

    return re.sub(r"[{}\\\s]", "", text)


def _get_bibtex_key(base_meta, project_id):
    """A citation key in the usual "lastnameYEAR" form ("lovelace2024"), from the first author with
    a last name, reduced to ASCII letters and digits since BibTeX keys can't hold spaces, commas or
    braces. Falls back to the project id ("DRP7"), which every publication has."""

    last_names = [
        (author.get("last_name") or "").strip()
        for author in base_meta.get("authors", [])
        if (author.get("last_name") or "").strip()
    ]
    publication_date = base_meta.get("publicationDate") or base_meta.get("publication_date") or ""
    if last_names:
        ascii_name = unicodedata.normalize("NFKD", last_names[0]).encode("ascii", "ignore").decode()
        key = re.sub(r"[^A-Za-z0-9]", "", ascii_name).lower() + re.sub(r"[^0-9]", "", publication_date[:4])
        if key and key[0].isalpha():
            return key
    return re.sub(r"[^A-Za-z0-9]", "", project_id)


def get_bibtex_citation(base_meta, doi, project_id, version, request):
    """Build a BibTeX entry for the Croissant `citeAs` property, whose spec asks for BibTeX
    ("Ideally, citations should be expressed using the bibtex format"). It's an @misc entry, the
    type DataCite's own BibTeX export uses for a dataset, with the same parts as the APA citation
    (get_apa_citation): authors as "Family, Given" joined by "and" (those without a last name are
    left out, as in the APA form), title, publisher, year, and the DOI, or the landing page's URL
    when there's no DOI. Missing parts are left out.
    """

    authors = [
        _bibtex_value(format_citation_author(author))
        for author in base_meta.get("authors", [])
        if (author.get("last_name") or "").strip()
    ]
    publication_date = base_meta.get("publicationDate") or base_meta.get("publication_date") or ""
    fields = [
        ("author", " and ".join(authors)),
        ("title", _bibtex_value(base_meta.get("title") or "")),
        ("publisher", _bibtex_value(settings.PORTAL_PUBLICATION_PUBLISHER or "")),
        ("year", re.sub(r"[^0-9]", "", publication_date[:4])),
        ("doi", _bibtex_verbatim(normalize_doi(doi) or "")),
        ("url", _bibtex_verbatim(doi_url(doi) or get_landing_page_url(project_id, version, request))),
    ]
    body = ",\n".join(f"  {name} = {{{value}}}" for name, value in fields if value)
    return f"@misc{{{_get_bibtex_key(base_meta, project_id)},\n{body}\n}}"


def get_citations(base_meta):
    """Build the schema.org `citation` list -- CreativeWork entries for academic articles the
    data provider recommends citing in addition to the dataset itself
    (https://developers.google.com/search/docs/appearance/structured-data/dataset) -- from the
    publication's `relatedPublications` entries. This is a distinct property from Croissant's
    own `citeAs` (built by get_bibtex_citation above): `citeAs` says how to cite *this* dataset,
    `citation` recommends *other* works to cite alongside it.

    Only "context" and "linked_dataset" entries are used: those describe a publication this
    dataset was produced in the context of (DataCite's IsDocumentedBy/IsPartOf relation --
    see get_related_identifiers in datacite_operations.py) -- i.e. something worth citing
    alongside the dataset. "cited_by" entries run the other direction (other work that cites
    *this* dataset) and so aren't a citation recommendation to make about this dataset's own
    page.
    """

    citations = []
    for r_data in base_meta.get("relatedPublications", []):
        if r_data.get("publicationType") not in ("context", "linked_dataset"):
            continue
        title = r_data.get("publicationTitle")
        if not title:
            continue

        # Google's Dataset guidelines expect `author` to be a Person or Organization, not a bare
        # string. The form only collects one free-text name with no type, so Person is assumed.
        author = r_data.get("publicationAuthor")

        citation = {
            "@type": "CreativeWork",
            "name": title,
            "author": {"@type": "Person", "name": author} if author else None,
            "datePublished": r_data.get("publicationDateOfPublication"),
            "url": r_data.get("publicationLink"),
            # Prefer the DOI (a stabler, more citable identifier than a plain link) when one's
            # given -- same "https://doi.org/<doi>" form used for the dataset's own `identifier`
            # in schema_org.py. Normalized first (projects/schema_models/doi.py), since the
            # form accepts a bare DOI, "doi:..." or a resolver URL; anything else is left out.
            "identifier": doi_url(r_data.get("publicationDoi")),
        }
        if r_data.get("publicationPublisher"):
            citation["publisher"] = {"@type": "Organization", "name": r_data["publicationPublisher"]}
        citations.append({k: v for k, v in citation.items() if v not in (None, "")})

    return citations


def format_citation_author(author):
    """Format one author as "Last, First" -- the order Google Scholar's indexing guide asks
    citation_author tags to use (https://scholar.google.com/intl/en/scholar/inclusion.html#indexing).
    Falls back to whichever name part is present if the other is missing, and to "" (filtered
    out by the caller) if neither is.
    """

    last_name = (author.get("last_name") or "").strip()
    first_name = (author.get("first_name") or "").strip()
    if last_name and first_name:
        return f"{last_name}, {first_name}"
    return last_name or first_name


def format_citation_date(date_value):
    """Reformat a stored ISO-ish date ("YYYY-MM-DD", optionally with a time component) into
    the slash-separated "YYYY/MM/DD" form (or "YYYY/MM"/"YYYY" for a partial date) that Google
    Scholar's citation_publication_date expects. A value that isn't recognizably ISO-formatted
    is passed through unchanged rather than dropped -- a wrong-shaped date is still more useful
    to Scholar than a missing one.
    """

    if not date_value:
        return None
    date_part = date_value[:10]
    if re.fullmatch(r"\d{4}(-\d{2}(-\d{2})?)?", date_part):
        return date_part.replace("-", "/")
    return date_value


def get_citation_pdf_url(file_objs, project_id, request):
    """The publication's PDF for Google Scholar's citation_pdf_url, only when it has exactly one.

    `file_objs` is get_unique_publication_file_objs' combined list, so a PDF attached to an entity node
    counts too. citation_pdf_url claims the PDF is the article's full text, and nothing in the
    metadata says which file that is. With several PDFs (papers, reports, supplements) any pick
    could be wrong, so none is emitted; with one, it's the only candidate.

    Scholar requires citation_pdf_url to resolve in the same subdirectory as the citing landing
    page, which get_publication_file_url's `file_download` route guarantees -- the same route
    `distribution`/`contentUrl` is built against, so the two always agree. That route serves PDFs
    from the portal host itself even when a web mirror is configured (PublicationFileDownloadView).
    """

    pdf_paths = []
    for file_obj in file_objs:
        if file_obj.get("type") != "file":
            continue
        name = file_obj.get("name")
        path = (file_obj.get("path") or "").lstrip("/")
        if not name or not path:
            continue
        encoding_format, _ = mimetypes.guess_type(name)
        if encoding_format == "application/pdf":
            pdf_paths.append(path)

    if len(pdf_paths) != 1:
        return None
    return get_publication_file_url(project_id, pdf_paths[0], request)
