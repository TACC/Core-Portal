import json
import logging
import mimetypes
from urllib.parse import quote

import networkx as nx
from django.conf import settings
from django.http import HttpResponse, Http404
from django.views.generic.base import TemplateView, View

from portal.apps.projects.workspace_operations.datacite_operations import get_datacite_json
from portal.apps.publications.models import Publication

logger = logging.getLogger(__name__)

# Properties Croissant (http://mlcommons.org/croissant/1.0) requires on a conformant Dataset.
# If any of these end up missing/empty for a publication, that publication cannot honestly
# claim `conformsTo` and get_schema_org_json raises rather than silently dropping the field.
REQUIRED_CROISSANT_FIELDS = ("license", "creator", "datePublished", "distribution")


class SchemaOrgValidationError(Exception):
    """Raised when a publication's metadata can't satisfy the schema.org/Croissant fields
    get_schema_org_json claims to emit."""


def _get_distribution(base_meta, project_id, request):
    """Build the Croissant/schema.org `distribution` list (one cr:FileObject per published file) from the publication's file_objs, pointing at the existing public, unauthenticated Tapis download route for the published project system.
    """

    published_system_id = f"{settings.PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX}.{project_id}"

    distribution = []
    for file_obj in base_meta.get("fileObjs", []):
        if file_obj.get("type") != "file":
            continue
        name = file_obj.get("name")
        path = (file_obj.get("path") or "").lstrip("/")
        if not name or not path:
            continue

        content_url = request.build_absolute_uri(
            f"/api/datafiles/tapis/download/projects/{published_system_id}/{quote(path)}/"
        )
        file_object = {
            "@type": "cr:FileObject",
            "@id": path,
            "name": name,
            "contentUrl": content_url,
        }

        encoding_format, _ = mimetypes.guess_type(name)
        if encoding_format:
            file_object["encodingFormat"] = encoding_format
        if file_obj.get("length") is not None:
            file_object["contentSize"] = f"{file_obj['length']} B"

        distribution.append(file_object)

    return distribution


def _get_record_sets(base_meta):
    """Build the Croissant `recordSet` list (one cr:RecordSet per tabular file that has known columns) from the publication's file_objs. This only ever reads metadata already stored on `fileObjs` (the `columns` field, populated at publish time for recognized tabular formats) -- it does no file I/O of its own, since this runs on every page request. Files with no known columns are simply skipped, so a publication with no extracted schemas yet degrades to no `recordSet` at all rather than a broken one.
    """

    record_sets = []
    for file_obj in base_meta.get("fileObjs", []):
        columns = file_obj.get("columns")
        path = (file_obj.get("path") or "").lstrip("/")
        if not columns or not path:
            continue

        record_sets.append(
            {
                "@type": "cr:RecordSet",
                "@id": f"{path}/records",
                "name": file_obj.get("name"),
                "field": [
                    {
                        "@type": "cr:Field",
                        "@id": f"{path}/{column['name']}",
                        "name": column["name"],
                        "dataType": column.get("dataType", "sc:Text"),
                        "source": {
                            # Links back to the matching entry this same publication's
                            # `distribution` emits in _get_distribution, whose "@id" is
                            # also the file's stripped path.
                            "fileObject": {"@id": path},
                            "extract": {"column": column["name"]},
                        },
                    }
                    for column in columns
                    if column.get("name")
                ],
            }
        )

    return record_sets


def _get_cite_as(base_meta, doi, project_id):
    """Build a plain-text citation for the Croissant `citeAs` property, following DataCite's recommended citation format (Creator(s) (PublicationYear). Title. Publisher. Identifier), from metadata already available on the publication so it can't go stale like a hand-written  placeholder would.
    """

    authors = base_meta.get("authors", [])
    author_names = "; ".join(
        f"{author.get('first_name', '')} {author.get('last_name', '')}".strip()
        for author in authors
        if author.get("last_name")
    )

    publication_date = base_meta.get("publicationDate") or base_meta.get("publication_date") or ""
    year = publication_date[:4] if publication_date else ""

    identifier = (
        f"https://doi.org/{doi}" if doi else f"{settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX}/{project_id}"
    )

    parts = [
        author_names,
        f"({year})" if year else None,
        base_meta.get("title"),
        settings.PORTAL_PUBLICATION_PUBLISHER,
        identifier,
    ]
    return ". ".join(part for part in parts if part)


def get_schema_org_json(pub, project_id, request):
    """Build a schema.org/Dataset JSON-LD object for a published project to embed directly in the page's <script type="application/ld+json"> tag for Google Dataset Search.
    """

    base_meta = pub.value
    doi = base_meta.get("doi")

    # A metadata-only / externally-hosted publication can legitimately have no files at all --
    # that's different from having files that failed to make it into `distribution` (missing
    # name/path on every fileObj), which is still a data bug. Only the latter should raise.
    has_files = any(file_obj.get("type") == "file" for file_obj in base_meta.get("fileObjs", []))

    creators = []
    for author in base_meta.get("authors", []):
        name = f"{author.get('first_name', '')} {author.get('last_name', '')}".strip()
        creator = {"@type": "Person", "name": name}
        if base_meta.get("institution"):
            creator["affiliation"] = {"@type": "Organization", "name": base_meta["institution"]}
        creators.append(creator)

    schema_org_json = {
        "@context": {
            "@language": "en",
            "@vocab": "https://schema.org/",
            # Verbatim (minus unused terms) from the Croissant spec's own recommended
            # @context (Appendix 1). Every Croissant-specific key we emit anywhere in this
            # document -- in `distribution` (cr:FileObject) or `recordSet` (cr:RecordSet,
            # field/source/extract/fileObject/dataType/column) -- needs an explicit mapping
            # here, or it silently falls back to the bare @vocab and resolves to a
            # nonexistent "https://schema.org/<term>" instead of its real Croissant IRI. A
            # strict Croissant validator (e.g. MLCommons' mlcroissant) would not recognize
            # this record as Croissant without these.
            "cr": "http://mlcommons.org/croissant/",
            "dct": "http://purl.org/dc/terms/",
            "sc": "https://schema.org/",
            "citeAs": "cr:citeAs",
            "column": "cr:column",
            "conformsTo": "dct:conformsTo",
            "dataType": {"@id": "cr:dataType", "@type": "@vocab"},
            "extract": "cr:extract",
            "field": "cr:field",
            "fileObject": "cr:fileObject",
            "fileSet": "cr:fileSet",
            "key": "cr:key",
            "recordSet": "cr:recordSet",
            "source": "cr:source",
        },
        "@type": "Dataset",
        "name": base_meta.get("title"),
        # Croissant hard-requires `distribution`, so only claim conformance when there's at
        # least one file to back it -- a fileless publication is still a valid plain
        # schema.org/Dataset, just not a Croissant one.
        "conformsTo": "http://mlcommons.org/croissant/1.0" if has_files else None,
        "description": base_meta.get("description"),
        "citeAs": _get_cite_as(base_meta, doi, project_id),
        "license": base_meta.get("license"),
        "url": f"{settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX}/{project_id}",
        "identifier": f"https://doi.org/{doi}" if doi else None,
        "creator": creators,
        "publisher": {
            "@type": "Organization",
            "name": settings.PORTAL_PUBLICATION_PUBLISHER,
        },
        "keywords": base_meta.get("keywords"),
        "datePublished": base_meta.get("publicationDate") or base_meta.get("publication_date"),
        "includedInDataCatalog": {
            "@type": "DataCatalog",
            "name": settings.PORTAL_PUBLICATION_PUBLISHER,
        },
        "distribution": _get_distribution(base_meta, project_id, request),
        "recordSet": _get_record_sets(base_meta),
    }

    # Drop empty/unset fields so the JSON-LD stays clean
    schema_org_json = {k: v for k, v in schema_org_json.items() if v not in (None, [], "")}

    # `distribution` is only required when the publication actually has files to list --
    # see the `has_files` note above.
    required_fields = REQUIRED_CROISSANT_FIELDS if has_files else [
        field for field in REQUIRED_CROISSANT_FIELDS if field != "distribution"
    ]
    missing = [field for field in required_fields if field not in schema_org_json]
    if missing:
        reason = (
            "it cannot honestly claim conformsTo http://mlcommons.org/croissant/1.0"
            if has_files
            else "its published Dataset metadata is incomplete"
        )
        raise SchemaOrgValidationError(
            f"Publication {project_id} is missing required schema.org Dataset field(s) "
            f"{', '.join(missing)}; {reason}. Fix the publication's metadata (or its file "
            "listing, for `distribution`) before this page's JSON-LD can be trusted."
        )

    return schema_org_json


def get_citation_context(pub, request):
    """Get Dublin Core metadata and the schema.org JSON-LD payload for a published project's page <head>."""

    citation_meta = {}
    citation_meta["keywords"] = ", ".join(pub.value.get("keywords", []))
    citation_meta["entities"] = [
        {
            "title": pub.value.get("title"),
            "description": pub.value.get("description"),
            "doi": pub.value.get("doi"),
            "authors": pub.value.get("authors", []),
            "publication_date": pub.value.get("publicationDate") or pub.value.get("publication_date"),
        }
    ]

    schema_org_json = get_schema_org_json(pub, pub.project_id, request)

    pub_title = pub.value["title"]
    return citation_meta, schema_org_json, pub_title


class IndexView(TemplateView):
    """
    Main workbench view.
    """

    template_name = "portal/apps/workbench/index.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        project_id = kwargs.get("project_id")
        if project_id:
            try:
                pub = Publication.objects.get(project_id=project_id)
                citation_context, schema_org_json, _ = get_citation_context(pub, self.request)
                context["schema_org_json"] = json.dumps(schema_org_json)
                context["citation_context"] = citation_context
                context["publisher"] = settings.PORTAL_PUBLICATION_PUBLISHER
            except Publication.DoesNotExist:
                pass
            except Exception as e:
                logger.exception(f"Failed to build meta tags for project {project_id}: {e}")
        context["setup_complete"] = (
            False if self.request.user.is_anonymous else self.request.user.profile.setup_complete
        )
        context["DEBUG"] = settings.DEBUG
        return context

    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)


class DataciteJsonPreviewView(View):
    """Plain-text preview of the DataCite payload and schema.org JSON-LD for a published project."""

    def get(self, request, project_id, *args, **kwargs):
        try:
            pub = Publication.objects.get(project_id=project_id)
        except Publication.DoesNotExist:
            raise Http404(f"No publication found for project {project_id}")

        pub_tree = nx.node_link_graph(pub.tree)
        datacite_json = get_datacite_json(pub_tree)

        try:
            schema_org_body = json.dumps(get_schema_org_json(pub, project_id, request), indent=2)
        except SchemaOrgValidationError as e:
            schema_org_body = f"INVALID: {e}"

        body = (
            "# DataCite payload (submitted to DataCite on publish)\n"
            # f"{json.dumps(datacite_json, indent=2)}\n"
            # "\n"
            "# schema.org/Dataset JSON-LD (for Google Dataset Search)\n"
            f"{schema_org_body}\n"
        )

        return HttpResponse(body, content_type="text/plain")
