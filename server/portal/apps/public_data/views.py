import networkx as nx
from django.views.generic.base import TemplateView
from django.conf import settings
from portal.apps.publications.models import Publication
from portal.apps.projects.workspace_operations.datacite_operations import get_datacite_json


def get_google_scholar_context(project_id):
    """Get context info for Google Scholar/Datacite"""
    pub = Publication.objects.get(project_id=project_id)
    pub_tree = nx.node_link_graph(pub.tree)
    latest_version = max(
            pub_tree.nodes[node]["version"] for node in pub_tree.successors("NODE_ROOT")
        )
    published_ents = [node for node in pub_tree.successors("NODE_ROOT")
                    if pub_tree.nodes[node]["version"] == latest_version]

    datacite_json_list = []
    scholar_meta = {}
    scholar_meta["keywords"] = ", ".join(pub.value.get("keywords", []))
    scholar_meta["citation_keywords"] = pub.value.get("keywords", [])
    scholar_meta["entities"] = []
    for ent in published_ents:
        ent_meta = pub_tree.nodes[ent]
        entity_scholar_data = {
            "title": ent_meta["value"]["title"],
            "description": ent_meta["value"].get("description"),
            "doi": ent_meta["value"].get("dois", [])[0],
            "authors": ent_meta["value"].get("authors", []),
            "publication_date": ent_meta["publicationDate"]
        }
        scholar_meta["entities"].append(entity_scholar_data)


        datacite_json_list.append(get_datacite_json(pub_tree,
                                                    ent_meta["uuid"],
                                                    latest_version))
    pub_title = pub.value["title"]
    return scholar_meta, datacite_json_list, pub_title


class IndexView(TemplateView):
    """
    Main workbench view.
    """
    template_name = 'portal/apps/workbench/index.html'

    def get_context_data(self, **kwargs):
        context = super(IndexView, self).get_context_data(**kwargs)
        try:
            scholar_context, datacite_context, title = get_google_scholar_context(kwargs['project_id'])
            context['dc_context'] = [json.dumps(ctx) for ctx in datacite_context]
            context['scholar_context'] = scholar_context
            context['citation_title'] = f"{kwargs['project_id']} | {title}"
        except Exception:
            # If we can't generate DataCite JSON, render the page without meta tags.
            pass
        context['setup_complete'] = False if self.request.user.is_anonymous \
            else self.request.user.profile.setup_complete
        context['DEBUG'] = settings.DEBUG
        return context

    def dispatch(self, request, *args, **kwargs):
        return super(IndexView, self).dispatch(request, *args, **kwargs)
