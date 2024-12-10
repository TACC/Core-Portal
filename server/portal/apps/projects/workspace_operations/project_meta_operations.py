import operator
import os
import uuid
from django.db import models, transaction
from django.conf import settings
from pathlib import Path
from typing import get_args
import networkx as nx
from portal.apps import SCHEMA_MAPPING
from portal.apps._custom.drp import constants
from portal.apps.projects.models.project_metadata import ProjectMetadata
from portal.apps._custom.drp.models import PartialEntityWithFiles, FileObj
from portal.apps.projects.workspace_operations.graph_operations import get_node_from_path, get_node_from_uuid, get_root_node, update_node_in_project

portal = settings.PORTAL_NAMESPACE.lower()

def snake_to_camel(snake_str):
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

def create_project_metadata(value):
    """Create a project metadata object in the database."""
    schema_model = SCHEMA_MAPPING[constants.PROJECT]
    validated_model = schema_model.model_validate(value)

    project_db_model = ProjectMetadata(
        name=constants.PROJECT, value=validated_model.model_dump()
    )
    project_db_model.save()
    return project_db_model

def create_entity_metadata(project_id, name, value):
    """Create entity metadata associated with an existing project."""
    base_project = ProjectMetadata.get_project_by_id(project_id)
    schema_model = SCHEMA_MAPPING[name]
    validated_model = schema_model.model_validate(value)

    entity_db_model = ProjectMetadata(
        name=name, value=validated_model.model_dump(exclude_none=True), base_project=base_project
    )
    entity_db_model.save()
    return entity_db_model

def get_value(project_id, path):
    """Retrieve metadata for a specific entity."""
    try:
        node = get_node_from_path(project_id, path)

        if not node or node['id'] == 'NODE_ROOT':
            return None
        
        if node.get('value'):
            return get_ordered_value(node['name'], node['value'])

        entity = ProjectMetadata.objects.get(uuid=node['uuid'])
        return get_ordered_value(entity.name, entity.value)
    except ProjectMetadata.DoesNotExist:
        return None

def get_ordered_value(name, value):
    """
        Return the metadata in the order defined in the Pydantic model.
        Also converts camelCase keys to snake_case. This is a temporary workaround until fields in settings_forms.py can be updated to use camelCase.
        """
    schema = SCHEMA_MAPPING.get(name)

    if not schema:
        return value  # Return the field value directly if no schema is found

    ordered_value = {}

    # Iterate through the model fields to preserve the order
    for field in schema.model_fields.keys():
        camel_field = snake_to_camel(field)
        field_value = value.get(camel_field)

        # Skip the field if there is no value (None or not present)
        if field_value is None:
            continue

        # if the fiels is a list, then we need to get the model of the list and process it
        if isinstance(field_value, list):
            field_annotation = schema.model_fields[field].annotation
            item_type = get_args(field_annotation)[0] if get_args(field_annotation) else None # returns the model class of the list

            # Check if the item type is a Pydantic model
            if item_type and hasattr(item_type, "model_fields"):
                # Re-order each item in the list if it's a list of Pydantic models
                ordered_value[field] = [
                    {k: item.get(snake_to_camel(k)) for k in item_type.model_fields.keys()}
                    for item in field_value
                ]
            else:
                ordered_value[field] = field_value
        else:
            ordered_value[field] = field_value

    return ordered_value

def get_entity(project_id, path):
    """Retrieve an entity by its path."""
    try:
        node = get_node_from_path(project_id, path)

        if not node or node['id'] == 'NODE_ROOT':
            return None

        return ProjectMetadata.objects.get(uuid=node['uuid'])
    except ProjectMetadata.DoesNotExist:
        return None
    
def create_file_obj(project_id, name, size, path, value):
    """Create a file object metadata associated with an existing project."""
    schema_model = SCHEMA_MAPPING[constants.FILE]
    validated_model = schema_model.model_validate(value)

    file_obj = FileObj(
        system=project_id,
        name=name,
        path=path,
        type='file',
        length=size,
        value=validated_model.model_dump(exclude_none=True),
        uuid=str(uuid.uuid4())
    )

    return file_obj

def get_file_obj( project_id, path):
    """Retrieve a file object by its path."""
    try:
        parent_path = str(Path(path).parent)

        parent_node = _get_valid_node(project_id, parent_path)

        if (parent_node.get('value')):
            file_objs = parent_node['value'].get('fileObjs', [])
        else:
            parent_entity = ProjectMetadata.objects.get(uuid=parent_node['uuid'])
            file_objs = parent_entity.value.get('fileObjs', [])

        file_obj = next((f for f in file_objs if f['path'] == path), None)
        if file_obj:
            return file_obj
        else:
            return None
    except:
        return None

@transaction.atomic
def patch_project_entity(project_id, value):
    """Update a project's `value` attribute. This method patches the metadata
    so that only fields in the payload are overwritten."""

    entity = ProjectMetadata.get_project_by_id(project_id)
    schema_model = SCHEMA_MAPPING[entity.name]

    entity_value = get_ordered_value(entity.name, entity.value)
    patched_metadata = {**entity_value, **value}

    update_node_in_project(project_id, 'NODE_ROOT', None, value.get('title'))

    validated_model = schema_model.model_validate(patched_metadata)
    entity.value = validated_model.model_dump(exclude_none=True)
    entity.save()
    return entity

@transaction.atomic
def patch_file_obj_entity(client, project_id, value, path):
    """Update an entity's `value` attribute"""

    parent_path = str(Path(path).parent)

    parent_node = _get_valid_node(project_id, parent_path)

    entity = ProjectMetadata.objects.get(uuid=parent_node['uuid'])
    file_objs = entity.value.get('fileObjs', [])
    file_obj = next((f for f in file_objs if f['path'] == path.strip('/')), None)

    if not file_obj:
        return None

    schema = SCHEMA_MAPPING[constants.FILE]
    validated_model = schema.model_validate(value)
    file_obj['value'] = validated_model.model_dump(exclude_none=True)

    entity_file_model = PartialEntityWithFiles.model_validate(entity.value)
    merged_file_objs = _merge_file_objs(entity_file_model.file_objs, [FileObj(**file_obj)])
    entity.value["fileObjs"] = [f.model_dump() for f in merged_file_objs]

    entity.save()
    
    return entity

@transaction.atomic
def patch_entity_and_node(project_id, value, path, new_path, new_name, uuid=None):
    """Perform an operation on an entity."""

    new_path_full = os.path.join(new_path.strip('/'), new_name)

    if (path):
        source_node = get_node_from_path(project_id, path)
    elif (not path and uuid):
        source_node = get_node_from_uuid(project_id, uuid)
    else: 
        raise ValueError("Invalid parameters: path or uuid must be provided.")
    
    entity = ProjectMetadata.objects.get(uuid=uuid if uuid else source_node['uuid'])

    new_parent_node = get_node_from_path(project_id, new_path)

    update_node_in_project(project_id, source_node['id'], new_parent_node['id'], new_name)

    schema_model = SCHEMA_MAPPING[entity.name]

    file_objs = entity.value.get('fileObjs', [])

    updated_file_objs = update_file_paths(file_objs, path, new_path_full)
    
    if value.get('file_objs') is not None:
        value.pop('file_objs')

    patched_metadata = {**value, 'fileObjs': updated_file_objs}
    validated_model = schema_model.model_validate(patched_metadata)
    entity.value = validated_model.model_dump(exclude_none=True)
    entity.save()

    update_children_file_paths(project_id, source_node['id'], path, new_path_full)

    return entity

@transaction.atomic
def patch_file_association(project_id, value, source_path_full, dest_path_full, new_name, operation):
    
    source_parent_path = str(Path(source_path_full).parent)
    dest_parent_path = str(Path(dest_path_full).parent)
    source_node = _get_valid_node(project_id, source_parent_path)
    dest_node = _get_valid_node(project_id, dest_parent_path)

    source_entity = ProjectMetadata.objects.get(uuid=source_node['uuid'])
    dest_entity = ProjectMetadata.objects.get(uuid=dest_node['uuid'])

    file_obj_dict = next(
        (f for f in source_entity.value.get('fileObjs', []) if f['path'] == source_path_full.strip('/')), None
    )

    if not file_obj_dict:
        return

    if operation == 'move':
        file_obj_dict['name'] = new_name
        file_obj_dict['path'] = dest_path_full.strip('/')
        file_obj = FileObj(**file_obj_dict)
        remove_file_associations(source_entity.uuid, [source_path_full])
        add_file_associations(dest_entity.uuid, [file_obj])
    elif operation == 'copy':
        file_obj = create_file_obj(project_id, new_name, file_obj_dict['length'], dest_path_full.strip('/'), file_obj_dict['value'])
        add_file_associations(dest_entity.uuid, [file_obj])

def delete_entity(uuid: str):
    """Delete a non-root entity."""
    entity = ProjectMetadata.objects.get(uuid=uuid)
    if entity.name in (constants.PROJECT, constants.PROJECT_GRAPH):
        raise ValueError("Cannot delete a top-level project or graph object.")
    entity.delete()

    return "OK"

def move_entity(client, project_id, current_path, new_path, value, uuid=None):
    """Handle moving an entity to a new location if the name or path changes."""
    from portal.libs.agave.operations import move

    node = get_node_from_path(project_id, current_path) if current_path else get_root_node(project_id)

    entity = ProjectMetadata.objects.get(uuid=uuid if uuid else node['uuid'])

    current_name = entity.value.get('name')
    current_path_full = current_path
    
    new_name = value.get('name')
    new_path = new_path


    if all([current_name, new_name, new_path, current_path_full]) and (
        current_name != new_name or new_path != str(Path(current_path_full).parent)
    ):
        move_result = move(client, project_id, current_path, project_id, new_path, new_name)
        move_message = move_result['message'].split('DestinationPath: ', 1)[1]
        new_name = ('/' + move_message).rsplit('/', 1)[1]

    return new_name

def clear_entities(project_id):
    """Delete all entities except the project root and graph. Used when changing project
    type, so that file associations don't get stuck on unreachable entities.
    """

    ProjectMetadata.get_entities_by_project_id(project_id).filter(
        ~models.Q(name__in=[constants.PROJECT, constants.PROJECT_GRAPH])
    ).delete()

    return "OK"

def _merge_file_objs(
    prev_file_objs: list[FileObj], new_file_objs: list[FileObj]
) -> list[FileObj]:
    """Combine two arrays of FileObj models, overwriting the first if there are conflicts."""
    new_file_paths = [f.path for f in new_file_objs]
    deduped_file_objs = [fo for fo in prev_file_objs if fo.path not in new_file_paths]

    return sorted(
        [*deduped_file_objs, *new_file_objs], key=operator.attrgetter("name", "path")
    )

def _filter_file_objs(
    prev_file_objs: list[FileObj], paths_to_remove: list[str]
) -> list[FileObj]:
    return sorted(
        [fo for fo in prev_file_objs if fo.path not in paths_to_remove],
        key=operator.attrgetter("name", "path"),
    )

def add_file_associations(uuid: str, new_file_objs: list[FileObj]):
    """Associate one or more file objects to an entity."""
    # Use atomic transaction here to prevent multiple calls from clobbering each other
    with transaction.atomic():
        entity = ProjectMetadata.objects.select_for_update().get(uuid=uuid)
        entity_file_model = PartialEntityWithFiles.model_validate(entity.value)
        merged_file_objs = _merge_file_objs(entity_file_model.file_objs, new_file_objs)
        entity.value["fileObjs"] = [f.model_dump() for f in merged_file_objs]

        entity.save()
    return entity

def set_file_associations(uuid: str, new_file_objs: list[FileObj]):
    """Replace the file associations for an entity with the specified set."""
    # Use atomic transaction here to prevent multiple calls from clobbering each other
    with transaction.atomic():
        entity = ProjectMetadata.objects.select_for_update().get(uuid=uuid)
        entity.value["fileObjs"] = [f.model_dump() for f in new_file_objs]
        entity.save()
    return entity

def remove_file_associations(uuid: str, file_paths: list[str]):
    """Remove file associations from an entity by their paths."""
    with transaction.atomic():
        entity = ProjectMetadata.objects.select_for_update().get(uuid=uuid)
        entity_file_model = PartialEntityWithFiles.model_validate(entity.value)

        filtered_file_objs = _filter_file_objs(entity_file_model.file_objs, file_paths)
        entity.value["fileObjs"] = [f.model_dump() for f in filtered_file_objs]

        entity.save()
    return entity

def create_file_entity(project_id: str, value: dict, uploaded_file, path: str):
        
        new_meta = create_entity_metadata(project_id, getattr(constants, value.get('data_type').upper()), {
            **value,
        })

        parent_node = get_node_from_path(project_id, path)

        file_obj = FileObj(
            system=project_id,
            name=uploaded_file.name,
            path=f'{path.strip("/")}/{uploaded_file.name}',
            type='file',
            length=uploaded_file.size,
            uuid=new_meta.uuid
        )

        if parent_node and parent_node['id'] != 'NODE_ROOT':
            add_file_associations(parent_node['uuid'], [file_obj])
        else:
            # Add file association to root node if no parent node/entity exists
            root_node = get_root_node(project_id)
            add_file_associations(root_node['uuid'], [file_obj])

def _get_valid_node(project_id, path):
    node = get_node_from_path(project_id, path)
    return node if node and node['id'] != 'NODE_ROOT' else get_root_node(project_id)

def update_file_paths(file_objs, old_path, new_path):
    """Update paths for a list of file objects."""
    updated_file_objs = []
    for file_obj in file_objs:
        file_obj['path'] = _update_file_obj_path(file_obj, old_path, new_path)
        updated_file_objs.append(file_obj)
    return updated_file_objs

def _update_file_obj_path(file_obj, old_path, new_path):

    new_file_obj_path = file_obj['path'].replace(old_path.strip('/'), new_path.strip('/'), 1)

    return new_file_obj_path

def update_children_file_paths(project_id, source_node_id, old_path, new_path):
    """Update paths for all descendant file objects."""
    graph = ProjectMetadata.objects.get(
        name=constants.PROJECT_GRAPH, base_project__value__projectId=project_id
    )

    graph_value = nx.node_link_graph(graph.value)

    children = list(nx.descendants(graph_value, source_node_id))

    for child in children: 
        child_uuid = graph_value.nodes[child]['uuid']
        child_enity = ProjectMetadata.objects.get(uuid=child_uuid)

        child_file_objs = child_enity.value.get('fileObjs', [])

        updated_child_file_objs = update_file_paths(child_file_objs, old_path, new_path)
        
        child_enity.value['fileObjs'] = updated_child_file_objs
        child_enity.save()

    return "OK"