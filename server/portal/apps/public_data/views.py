import json
import logging

import networkx as nx
from django.conf import settings
from django.http import HttpResponse, Http404
from django.views.generic.base import TemplateView, View

from portal.apps.projects.workspace_operations.datacite_operations import get_datacite_json
from portal.apps.publications.models import Publication

logger = logging.getLogger(__name__)


def get_google_scholar_context(pub):
    """Get context info for Google Scholar/Datacite"""
    pub_tree = nx.node_link_graph(pub.tree)

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

    datacite_json_list = [get_datacite_json(pub_tree)]

    pub_title = pub.value["title"]
    return scholar_meta, datacite_json_list, pub_title


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
    """Plain-text preview of the exact JSON payload submitted to DataCite for a published project."""

    def get(self, request, project_id, *args, **kwargs):
        try:
            pub = Publication.objects.get(project_id=project_id)
        except Publication.DoesNotExist:
            raise Http404(f"No publication found for project {project_id}")

        pub_tree = nx.node_link_graph(pub.tree)
        datacite_json = get_datacite_json(pub_tree)

        return HttpResponse(
            json.dumps(datacite_json, indent=2),
            content_type='text/plain',
        )
