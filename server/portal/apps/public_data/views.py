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


def _get_cite_as(base_meta, doi, project_id):
    """Build a plain-text citation for the Croissant `citeAs` property, following DataCite's
    recommended citation format (Creator(s) (PublicationYear). Title. Publisher. Identifier),
    from metadata already available on the publication so it can't go stale like a hand-written
    placeholder would.
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
            # "cr" and "dct" are required so the Croissant-specific terms below resolve to
            # the real MLCommons/Dublin-Core IRIs instead of silently falling back to a
            # nonexistent "https://schema.org/citeAs" or "https://schema.org/conformsTo"
            # under the bare @vocab. Without this mapping a strict Croissant validator
            # (e.g. MLCommons' mlcroissant) would not recognize this record as Croissant.
            "cr": "http://mlcommons.org/croissant/",
            "dct": "http://purl.org/dc/terms/",
            "citeAs": "cr:citeAs",
            "conformsTo": "dct:conformsTo",
        },
        "@type": "Dataset",
        "name": base_meta.get("title"),
        "conformsTo": "http://mlcommons.org/croissant/1.0",
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
    }

    # Drop empty/unset fields so the JSON-LD stays clean
    return {k: v for k, v in schema_org_json.items() if v not in (None, [], "")}


def get_citation_context(pub, request):
    """Get Dublin Core metadata and the schema.org JSON-LD payload for a
    published project's page <head>."""

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
        schema_org_json = get_schema_org_json(pub, project_id, request)

        body = (
            "# DataCite payload (submitted to DataCite on publish)\n"
            # f"{json.dumps(datacite_json, indent=2)}\n"
            # "\n"
            "# schema.org/Dataset JSON-LD (for Google Dataset Search)\n"
            f"{json.dumps(schema_org_json, indent=2)}\n"
        )

        return HttpResponse(body, content_type="text/plain")
