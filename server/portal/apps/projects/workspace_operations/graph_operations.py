from typing import Any, Dict
import networkx as nx
from django.db import transaction
import uuid
import copy
from django.conf import settings
from portal.apps._custom.drp import constants
from portal.apps.projects.models.project_metadata import ProjectMetadata


def _get_next_child_order(graph: nx.DiGraph, parent_node: str) -> int:
    child_nodes = graph.successors(parent_node)
    max_order = max((graph.nodes[child]["order"] for child in child_nodes), default=-1)
    return int(max_order) + 1

def _add_node_to_graph(
    graph: nx.DiGraph, parent_node_id: str, meta_uuid: str, name: str, label: str
) -> tuple[nx.DiGraph, str | None]:
    """Add a node with data to a graph, and return the graph."""
    if not graph.has_node(parent_node_id):
        raise nx.exception.NodeNotFound

    # no-op if metadata with this UUID is already associated.
    if meta_uuid in (
        graph.nodes[node]["uuid"] for node in graph.successors(parent_node_id)
    ):
        return (graph, None)

    _graph: nx.DiGraph = copy.deepcopy(graph)
    order = _get_next_child_order(_graph, parent_node_id)
    child_node_id = f"NODE_{name}_{uuid.uuid4()}"
    _graph.add_node(child_node_id, uuid=meta_uuid, name=name, order=order, label=label)
    _graph.add_edge(parent_node_id, child_node_id)
    return (_graph, child_node_id)

def initialize_project_graph(project_id: str):
    """
    Initialize the entity graph in a default state for a project. For type Other, the
    default graph has an "empty" root node that contains the base entity as its child.
    This is to allow multiple versions to be published as siblings in the graph.
    Otherwise, the graph is initialized as a single node pointing to the project root.
    This method should be called when creating a new project AND when changing a
    project's type.
    """
    project_model = ProjectMetadata.get_project_by_id(project_id)
    project_graph = nx.DiGraph()

    root_node_id = "NODE_ROOT"
    project_type = project_model.value.get("projectType", None)
    base_node_data = {
        "uuid": project_model.uuid,
        "name": project_model.name,
        "projectType": project_type,
        "order": 0,
        "label": project_model.value.get("title")
    }

    if project_type == "other":
        # type Other projects have a "null" parent node above the project root, to
        # support multiple versions.
        project_graph.add_node(
            root_node_id, **{"uuid": None, "name": None, "projectType": "other"}
        )
        base_node_id = f"NODE_project_{uuid.uuid4()}"
        project_graph.add_node(base_node_id, **base_node_data)
        project_graph.add_edge(root_node_id, base_node_id)
    else:
        project_graph.add_node(root_node_id, **base_node_data)

    graph_model_value = nx.node_link_data(project_graph)
    res, _ = ProjectMetadata.objects.update_or_create(
        name=constants.PROJECT_GRAPH,
        base_project=project_model,
        defaults={"value": graph_model_value},
    )
    return res

def traverse_graph(project_graph, root_node, path_components):
    current_node = root_node
    for component in path_components:
        found = False
        for successor in project_graph.successors(current_node):
            name = project_graph.nodes[successor]['label']
            if name == component:
                current_node = successor
                found = True
                break
        if not found:
            return None
    return {"id": current_node, **project_graph.nodes[current_node]}

def get_node_from_path(project_id: str, path: str) -> Dict[str, Any]:
    """Return the node ID for the parent of a node with the given path."""

    graph_model = ProjectMetadata.objects.get(
        name=constants.PROJECT_GRAPH, base_project__value__projectId=project_id
    )
    project_graph = nx.node_link_graph(graph_model.value)

    path_parts = path.strip("/").split("/")

    if len(path_parts) == 0 or path_parts[0] == "":
        return {"id": "NODE_ROOT"}
    
    node = traverse_graph(project_graph, "NODE_ROOT", path_parts)

    return node

def get_root_node(project_id: str) -> Dict[str, Any]:
    """Return the root node for a project graph."""
    graph_model = ProjectMetadata.objects.get(
        name=constants.PROJECT_GRAPH, base_project__value__projectId=project_id
    )
    project_graph = nx.node_link_graph(graph_model.value)
    return {"id": "NODE_ROOT", **project_graph.nodes["NODE_ROOT"]}

def update_node_in_project(project_id: str, node_id: str, new_parent: str = None, new_name: str = None):
    """Update the database entry for a project graph to update a node."""
    with transaction.atomic():
        graph_model = ProjectMetadata.objects.select_for_update().get(
            name=constants.PROJECT_GRAPH, base_project__value__projectId=project_id
        )
        project_graph = nx.node_link_graph(graph_model.value)

        if not project_graph.has_node(node_id):
            raise nx.exception.NodeNotFound

        if new_parent and new_parent != node_id:
            # Remove the node from the graph and re-add it under the new parent.
            parent_node = new_parent
            if not project_graph.has_node(parent_node):
                raise nx.exception.NodeNotFound
            project_graph.remove_edge(
                next(project_graph.predecessors(node_id)), node_id
            )
            project_graph.add_edge(parent_node, node_id)

        if new_name:
            project_graph.nodes[node_id]["label"] = new_name

        graph_model.value = nx.node_link_data(project_graph)
        graph_model.save()

def add_node_to_project(project_id: str, parent_node: str, meta_uuid: str, name: str, label: str):
    """Update the database entry for a project graph to add a node."""
    # Lock the project graph's tale row to prevent conflicting updates.
    with transaction.atomic():
        graph_model = ProjectMetadata.objects.select_for_update().get(
            name=constants.PROJECT_GRAPH, base_project__value__projectId=project_id
        )
        project_graph = nx.node_link_graph(graph_model.value)

        (updated_graph, new_node_id) = _add_node_to_graph(
            project_graph, parent_node, meta_uuid, name, label
        )

        graph_model.value = nx.node_link_data(updated_graph)
        graph_model.save()
    return new_node_id

def get_node_from_uuid(project_id: str, uuid: str):
    """Get a node from the project graph using its UUID."""
    graph_model = ProjectMetadata.objects.get(
        name=constants.PROJECT_GRAPH, base_project__value__projectId=project_id
    )
    project_graph = nx.node_link_graph(graph_model.value)

    for node_id in project_graph.nodes:
        if project_graph.nodes[node_id]["uuid"] == uuid:
            return {"id": node_id, **project_graph.nodes[node_id]}
    return None

def remove_trash_nodes(graph: nx.DiGraph):
    trash_node_id = None
    for node_id in graph.nodes:
        trash_node = graph.nodes[node_id].get("name") == constants.TRASH
        if trash_node:
            trash_node_id = node_id
            break

    if trash_node_id:
        trash_descendants = nx.descendants(graph, trash_node_id)
        nodes_to_remove = {trash_node_id} | trash_descendants
        graph.remove_nodes_from(nodes_to_remove)
    return graph

def get_path_uuid_mapping(project_id: str):
    """Return a mapping of node paths to UUIDs for a project graph."""
    graph_model = ProjectMetadata.objects.get(
        name=constants.PROJECT_GRAPH, base_project__value__projectId=project_id
    )
    project_graph = nx.node_link_graph(graph_model.value)
    path_uuid_mapping = {}
    for node_id in project_graph.nodes:
        path_nodes = nx.shortest_path(project_graph, 'NODE_ROOT', node_id)[1:]
        path =  '/'.join(project_graph.nodes[parent]['label'] for parent in path_nodes if 'label' in project_graph.nodes[parent])
        path_uuid_mapping[path] = project_graph.nodes[node_id]["uuid"]
    return path_uuid_mapping