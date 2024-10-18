import operator
from django.db import models, transaction
from portal.apps import SCHEMA_MAPPING
from portal.apps._custom.drp import constants
from django.conf import settings
from portal.apps.projects.models.project_metadata import ProjectMetadata
from portal.apps._custom.drp.models import PartialEntityWithFiles, FileObj
from portal.apps.projects.workspace_operations.graph_operations import get_node_from_path, get_root_node, update_node_in_project
from pathlib import Path

portal = settings.PORTAL_NAMESPACE.lower()

def create_project_metdata(value):
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

def get_entity(project_id, path):
    """Retrieve metadata for a specific entity."""
    try:
        node = get_node_from_path(project_id, path)

        if not node or node['id'] == 'NODE_ROOT':
            return None
        entity = ProjectMetadata.objects.get(uuid=node['uuid'])
        # entity = ProjectMetadata.get_entity_by_project_id_and_path(project_id, path)
        return entity
    except ProjectMetadata.DoesNotExist:
        return None

def get_file_association_entity(project_id, path):
    try: 
        parent_path = str(Path(path).parent)

        parent_node = _get_valid_node(project_id, parent_path)

        parent_entity = ProjectMetadata.objects.get(uuid=parent_node['uuid'])
        file_objs = parent_entity.value.get('fileObjs', [])
        file_obj = next((f for f in file_objs if f['path'] == path), None)
        if file_obj:
            entity = ProjectMetadata.objects.get(uuid=file_obj['uuid'])
            return entity
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

    patched_metadata = {**value, 'projectId': project_id, 'fileObjs': entity.value.get('fileObjs', [])}

    update_node_in_project(project_id, 'NODE_ROOT', None, value.get('title'))

    validated_model = schema_model.model_validate(patched_metadata)
    entity.value = validated_model.model_dump(exclude_none=True)
    entity.save()
    return entity

@transaction.atomic
def patch_entity(client, project_id, value, uuid=None, path=None, updated_path=None):
    """Update an entity's `value` attribute. This method patches the metadata
    so that only fields in the payload are overwritten."""

    node = get_node_from_path(project_id, path) if path else get_root_node(project_id)
    entity = ProjectMetadata.objects.get(uuid=node['uuid'])

    current_name = entity.value.get('name')
    current_path_full = path
    
    new_name = value.get('name')
    new_path = updated_path


    if all([current_name, new_name, new_path, current_path_full]) and (
        current_name != new_name or updated_path != str(Path(current_path_full).parent)
    ):
        new_name = _move_entity(client, project_id, current_path_full, new_path, new_name, value)

        if new_path:
            parent_node = get_node_from_path(project_id, new_path)
            update_node_in_project(project_id, node['id'], parent_node['id'], new_name)
        else:
            update_node_in_project(project_id, node['id'], None, new_name)
        
    schema_model = SCHEMA_MAPPING[entity.name]

    patched_metadata = {**value, 'fileObjs': entity.value.get('fileObjs', [])}
    validated_model = schema_model.model_validate(patched_metadata)
    entity.value = validated_model.model_dump(exclude_none=True)
    entity.save()

    return entity

@transaction.atomic
def patch_file_obj_entity(client, project_id, value, path):
    """Update an entity's `value` attribute"""

    parent_path = str(Path(path).parent)

    parent_node = _get_valid_node(project_id, parent_path)

    parent_entity = ProjectMetadata.objects.get(uuid=parent_node['uuid'])
    file_objs = parent_entity.value.get('fileObjs', [])
    file_obj = next((f for f in file_objs if f['path'] == path.strip('/')), None)

    if not file_obj:
        return None

    entity = ProjectMetadata.objects.get(uuid=file_obj['uuid'])

    schema_model = SCHEMA_MAPPING[entity.name]

    patched_metadata = {**value}

    validated_model = schema_model.model_validate(patched_metadata)
    entity.value = validated_model.model_dump(exclude_none=True)
    entity.save()

    return entity

def delete_entity(uuid: str):
    """Delete a non-root entity."""
    entity = ProjectMetadata.objects.get(uuid=uuid)
    if entity.name in (constants.PROJECT, constants.PROJECT_GRAPH):
        raise ValueError("Cannot delete a top-level project or graph object.")
    entity.delete()

    return "OK"

def _move_entity(client, project_id, current_path, new_path, new_name, value):
    """Handle moving an entity to a new location if the name or path changes."""
    from portal.libs.agave.operations import move

    move_result = move(client, project_id, current_path, project_id, new_path, new_name)
    move_message = move_result['message'].split('DestinationPath: ', 1)[1]
    new_name = ('/' + move_message).rsplit('/', 1)[1]

    value['name'] = new_name
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

    file_obj_dict['name'] = new_name
    file_obj_dict['path'] = dest_path_full.strip('/')
    file_obj = FileObj(**file_obj_dict)

    if operation == 'move':
        remove_file_associations(source_entity.uuid, [source_path_full])
        add_file_associations(dest_entity.uuid, [file_obj])
    elif operation == 'copy':
        new_meta = create_entity_metadata(project_id, getattr(constants, value.get('data_type').upper()), {**value})
        file_obj.uuid = new_meta.uuid
        add_file_associations(dest_entity.uuid, [file_obj])