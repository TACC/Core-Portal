import operator
from django.db import models, transaction
from portal.apps import SCHEMA_MAPPING
from portal.apps._custom.drp import constants
from django.conf import settings
from portal.apps.projects.models.project_metadata import ProjectMetadata
from portal.apps.projects.schema_models.base import (
    FileObj, 
    PartialEntityWithFiles
)
from portal.apps.projects.workspace_operations.graph_operations import get_node_from_path, update_node_in_project

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

@transaction.atomic
def patch_metadata(client, project_id, value, uuid=None, path=None):
    """Update an entity's `value` attribute. This method patches the metadata
    so that only fields in the payload are overwritten."""
    node = get_node_from_path(project_id, path)

    if uuid:
        entity = ProjectMetadata.objects.get(uuid=uuid)
    elif project_id and path:
        entity = ProjectMetadata.objects.get(uuid=node['uuid'])
    else:
        raise ValueError("Either 'uuid' or both 'project_id' and 'path' must be provided.")
    
    print('entity', entity)

    current_name = entity.value.get('name')
    current_path = entity.value.get('path')
    
    new_name = value['name']
    new_path = path

    print('current_name', current_name)
    print('current_path', current_path)
    print('new_name', new_name)
    print('new_path', new_path)

    # # If the name or path has changed, move the entity to the new location.
    if current_name != new_name or current_path != new_path:

        from portal.libs.agave.operations import move

        move_result = move(client, project_id, current_path, project_id, new_path, new_name)
        move_message = move_result['message'].split('DestinationPath: ', 1)[1]
        new_name = ('/' + move_message).rsplit('/', 1)[1]
        value['name'] = new_name
        update_node_in_project(project_id, node['id'], value)
        

    schema_model = SCHEMA_MAPPING[entity.name]

    patched_metadata = {**entity.value, **value}
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

        # Remove tags associated with these entity/file path combinations.
        tagged_paths = []
        for path in file_paths:
            tagged_paths += [
                t["path"]
                for t in entity.value.get("fileTags", [])
                if t["path"].startswith(path)
            ]
        entity.value["fileTags"] = [
            t
            for t in entity.value.get("fileTags", [])
            if not (t["path"] in tagged_paths)
        ]
        entity.save()
    return entity


