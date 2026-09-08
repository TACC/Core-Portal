import json
import logging

import networkx as nx
from django.conf import settings
from django.http import HttpResponse, Http404
from django.views.generic.base import TemplateView, View

from portal.apps.projects.workspace_operations.datacite_operations import get_datacite_json
from portal.apps.publications.models import Publication

logger = logging.getLogger(__name__)


def get_schema_org_json(pub, project_id):
    """Build a schema.org/Dataset JSON-LD object for a published project. Unlike the payload embedded today in the page's <script type="application/ld+json"> tag (which is just the raw DataCite payload reused as-is), this maps the same project metadata onto proper schema.org/Dataset terms for Google Dataset Search.
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
            "@vocab": "https://schema.org"
        },
        "@type": "Dataset",
        "name": base_meta.get("title"),
        "conformsTo": "http://mlcommons.org/croissant/1.0",
        "description": base_meta.get("description"),
        # "citeAs": "@Article{asano21pass, author = \"Yuki M. Asano and Christian Rupprecht and ...",
        "citeAs": "TBD",
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
    }

    # Drop empty/unset fields so the JSON-LD stays clean
    return {k: v for k, v in schema_org_json.items() if v not in (None, [], "")}


def get_google_scholar_context(pub):
    # """Get context info for Google Scholar/Datacite"""
    # pub_tree = nx.node_link_graph(pub.tree)
    """Get context info for Google Scholar/schema.org JSON-LD"""

    scholar_meta = {}
    scholar_meta["keywords"] = ", ".join(pub.value.get("keywords", []))
    scholar_meta["citation_keywords"] = pub.value.get("keywords", [])
    scholar_meta["entities"] = [
        {
            "title": pub.value.get("title"),
            "description": pub.value.get("description"),
            "doi": pub.value.get("doi"),
            "authors": pub.value.get("authors", []),
            "publication_date": pub.value.get("publicationDate") or pub.value.get("publication_date"),
        }
    ]

    # datacite_json_list = [get_datacite_json(pub_tree)]
    schema_org_json_list = [get_schema_org_json(pub, pub.project_id)]

    pub_title = pub.value["title"]
    # return scholar_meta, datacite_json_list, pub_title
    return scholar_meta, schema_org_json_list, pub_title


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
                scholar_context, datacite_context, title = get_google_scholar_context(pub)
                context["dc_context"] = [json.dumps(ctx) for ctx in datacite_context]
                context["scholar_context"] = scholar_context
                context["citation_title"] = f"{project_id} | {title}"
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
        schema_org_json = get_schema_org_json(pub, project_id)

        body = (
            "# DataCite payload (submitted to DataCite on publish)\n"
            f"{json.dumps(datacite_json, indent=2)}\n"
            "\n"
            "# schema.org/Dataset JSON-LD (for Google Dataset Search)\n"
            f"{json.dumps(schema_org_json, indent=2)}\n"
        )

        return HttpResponse(body, content_type="text/plain")

