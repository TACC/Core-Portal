import os
import networkx as nx
from pathlib import Path
from django.conf import settings
from django.db import transaction
import dateutil.parser
from django.utils import timezone
from django.core.management.base import BaseCommand
from portal.apps.projects.migration_utils.sql_db_utils import (get_project_by_id, query_advanced_file_metadata, query_analysis_data, 
                                                               query_files, query_origin_data, query_projects, query_published_projects, 
                                                               query_related_publications, query_authors, query_samples, query_user)
from portal.apps._custom.drp.models import DrpProjectRelatedPublications
from portal.apps import SCHEMA_MAPPING
from portal.apps._custom.drp import constants, metadata_mappings
from portal.apps.projects.workspace_operations.project_meta_operations import (add_file_associations, create_entity_metadata, 
                                                                               create_file_obj, create_project_metadata)
from portal.apps.projects.workspace_operations.shared_workspace_operations import create_workspace_dir, create_workspace_system, set_workspace_acls
from portal.libs.agave.utils import service_account
from portal.libs.agave.operations import mkdir
from portal.apps.projects.workspace_operations.graph_operations import add_node_to_project, get_node_from_uuid, get_root_node, initialize_project_graph
from portal.apps.projects.workspace_operations.project_publish_operations import _add_values_to_tree
from portal.apps.publications.models import Publication
from portal.apps.search.tasks import index_publication
from portal.apps.projects.models.project_metadata import ProjectMetadata
from tapipy.errors import NotFoundError

class Command(BaseCommand):
    help = "Migrate DRP project metadata to the new schema."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run', 
            action='store_true', 
            help="Run the command without saving changes."
        )

        parser.add_argument(
            '--project-id',
            type=str,
            nargs='+',
            help="Specify a project ID to migrate."
        )

        parser.add_argument(
            '--publication',
            action='store_true',
            help="Creates a published project and publication using existing published projects"
        )

        parser.add_argument(
            '--project',
            action='store_true',
            help="Creates a regular project using existing unpublished projects"
        )

    def make_directories(self, project_id, mappings):

        client = service_account()

        paths = [data['path'] for data in mappings.values()]

        for path in paths:
            parent_path, name = os.path.split(path)
            mkdir(client, project_id, parent_path, name)
            print(f"Created directory at path: {path} with name: {name}")

    def update_project_and_create_publication(self, published_project_id):

        client = service_account()
        project_id = published_project_id.split(f'{settings.PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX}.')[-1]

        pub_tree = _add_values_to_tree(published_project_id)
        published_project = ProjectMetadata.get_project_by_id(published_project_id)
        published_project.project_graph.value = nx.node_link_data(pub_tree)
        published_project.save()

        pub_date_str = published_project.value.get('publicationDate', None)

        pub_defaults = {
            'value': published_project.value,
            'tree': nx.node_link_data(pub_tree),
            'version': 1,
        }

        if pub_date_str:
            pub_date = dateutil.parser.parse(pub_date_str)
            pub_date = timezone.make_aware(pub_date)
            pub_defaults['created'] = pub_date

        pub_metadata = Publication.objects.update_or_create(
            project_id=project_id,
            defaults=pub_defaults
        )

        print(f'Created publication for {published_project_id}')

        client.systems.shareSystemPublic(systemId=published_project_id)

        index_publication(project_id)
    
    def handle(self, *args, **options):
        self.dry_run = options['dry_run']
        
        if not options['project'] and not options['publication']:
            print("Please specify either --project or --publication")
            return
        
        if options['project'] and options['publication']:
            print("Please specify either --project or --publication, not both")
            return
        
        self.publication = options['publication']
        self.project = options['project']

        if options['project_id']:
            projects = get_project_by_id(options['project_id'])
        elif (self.publication):
            projects = query_published_projects()
        else: 
            projects = query_projects()

        print(f"Found {len(projects)} projects to migrate")

        projects_with_error = []

        for project in projects:

            try:
                with transaction.atomic():
                    print(f"Processing project {project['id']}")

                    project_mapping = self.migrate_project(project)

                    sample_mappings = self.migrate_sample(project_mapping)

                    origin_data_mappings = self.migrate_origin_data(project_mapping, sample_mappings)

                    analysis_data_mappings = self.migrate_analysis_dataset(project_mapping, sample_mappings, origin_data_mappings)

                    if not self.dry_run:
                        _, new_project_id = project_mapping
                        self.make_directories(new_project_id, sample_mappings)
                        self.make_directories(new_project_id, origin_data_mappings)
                        self.make_directories(new_project_id, analysis_data_mappings)

                        if self.publication:                
                            self.update_project_and_create_publication(new_project_id)
                    else: 
                        print(f"Dry run success for project {project['id']}: No changes made to the database.")
            except Exception as e:
                print(f"Error processing project {project['id']}: {e}")
                projects_with_error.append({project['id']: str(e)})
                continue

        if projects_with_error:
            print(f'Migration completed with errors for projects: {projects_with_error}')
        else: 
            print(f'Migration completed successfully for all projects.')

    def get_project_users(self, project_id, user_id):

        user_list = []

        owner_data = query_user(user_id)
        if owner_data:
            owner = owner_data[0]
            user_list.append({
                'first_name': owner['first_name'],
                'last_name': owner['last_name'],
                'email': owner['email']
            })

        collaborators = query_authors(project_id)

        for collaborator in collaborators:
            user_data = query_user(collaborator['user_id'])
            if user_data:
                user = user_data[0]
                user_info = {
                    'first_name': user['first_name'],
                    'last_name': user['last_name'],
                    'email': user['email']
                }
                if user_info not in user_list:  # Avoid duplicates
                    user_list.append(user_info)

        return user_list

    def get_related_publications(self, project_id):
        """Fetch related publications."""

        related_pubs = query_related_publications(project_id)
        migrated_related_pubs = []
        
        for pub in related_pubs:
            pub_link = pub['doi'].split("doi:")[-1] if pub['doi'] else pub['url']

            if not pub_link:
                print(f'No related publication link found for {pub["title"]}')

            migrated_related_pubs.append(DrpProjectRelatedPublications(
                publication_type='cited_by',
                publication_title=pub['title'],
                publication_link=pub_link if pub_link else '',
                publication_author=pub['author'],
                publication_date_of_publication=pub['publication_year'],
                publication_publisher=pub['publisher'],
                publication_description=pub['abstract'],
            ))

        return migrated_related_pubs
    
    def create_project(self, legacy_project_id, project_metadata_value):

        service_client = service_account()
        portal_admin_username = settings.PORTAL_ADMIN_USERNAME

        workspace_id = f'{settings.PORTAL_PROJECTS_ID_PREFIX}-{legacy_project_id}'

        system_prefix = settings.PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX if self.publication else settings.PORTAL_PROJECTS_SYSTEM_PREFIX

        system_id = f'{system_prefix}.{workspace_id}' 

        root_system_name = settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME if self.publication else settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME

        root_dir = settings.PORTAL_PROJECTS_PUBLISHED_ROOT_DIR if self.publication else settings.PORTAL_PROJECTS_ROOT_DIR

        project_data = {
            **project_metadata_value,
            "project_id": system_id,
            "cover_image": f"media/{workspace_id}/cover_image/{Path(project_metadata_value['cover_image']).name}" if project_metadata_value.get('cover_image') else None,
        }

        print(f"Creating project {project_data['title']}")

        try:
            # Check if the project metadata already exists and delete it if it does
            project = ProjectMetadata.get_project_by_id(system_id)
            project.delete()
        except ProjectMetadata.DoesNotExist:
            # Project does not exist, continue with creation
            pass

        new_project = create_project_metadata(project_data)
        new_project.save()

        try:
            existing_system = service_client.systems.getSystem(systemId=system_id)
        except NotFoundError:
            existing_system = None
            pass

        if existing_system:
            print(f"Project {project_data['title']} already exists. Skipping creation.")
            return system_id

        create_workspace_dir(workspace_id, root_system_name)

        set_workspace_acls(service_client, root_system_name, workspace_id, portal_admin_username, "add", "writer")

        create_workspace_system(
            service_client, workspace_id, project_data['title'], project_data['description'], None,
            f"{system_id}",
            f"{root_dir}/{workspace_id}"
        )
        
        print(f"Created project {project_data['title']} with ID {system_id}")
        
        return system_id

    def migrate_project(self, project):
        """Migrates a project using `create_entity_metadata` and supports dry-run mode."""

        project_data = {
            "title": project['name'],
            "description": project['description'],
            "license": 'ODC-BY 1.0' if project['license'] and project['license'] == 1 else None,
            "doi": project['doi'].split("doi:")[-1] if project['doi'] else None,
            "institution": project['institution'] if project['institution'] else None,
            "authors": self.get_project_users(project['id'], project['user_id']),
            "is_review_project": False,
            "is_published_project": True if self.publication else False,
            "publication_date": str(project['creation_date']) if self.publication else None,  
            "related_publications": self.get_related_publications(project['id']),
            "cover_image": project['cover_pic'] if project['cover_pic'] else None,
        }

        if self.dry_run:
            project_id = 'dry_run_project_id'
            project_data['project_id'] = project_id
            if project_data.get('cover_image'):
                project_data['cover_image'] = f"media/{project_id}/cover_image/{Path(project_data['cover_image']).name}"
            else:
                project_data['cover_image'] = None
            validated_project = SCHEMA_MAPPING[constants.PROJECT].model_validate(project_data)
            # print(f"Dry run: Successfully created project with legacy id: {project['id']}")
        else:
            project_id = self.create_project(project['id'], project_data)
            initialize_project_graph(project_id)

        return project['id'], project_id

    def migrate_sample(self, project_mapping):

        legacy_project_id, new_project_id = project_mapping

        samples = query_samples(legacy_project_id)
        sample_mappings = {}

        for sample in samples:
            porous_media_type = metadata_mappings.SAMPLE_POROUS_MEDIA_TYPE_MAPPINGS.get(sample['porous_media_type'])
            source = metadata_mappings.SAMPLE_SOURCE_MAPPINGS.get(sample['source'])

            sample_data = {
                "name": sample['name'],
                "description": sample['description'],
                "data_type": "sample",
                "porous_media_type": porous_media_type,
                "porous_media_other_description": sample.get('porous_media_other_description'),
                "source": source,
                "grain_size_min": sample.get('grain_size_min'),
                "grain_size_max": sample.get('grain_size_max'),
                "grain_size_avg": sample.get('grain_size_avg'),
                "porosity": sample.get('porosity'),
                "identifier": sample.get('identifier'),
                "geographic_origin": sample.get('geographic_origin'),
                "geographical_location": sample.get('location'),
            }

            if self.dry_run: 
                validated_sample = SCHEMA_MAPPING[constants.SAMPLE].model_validate(sample_data)
                sample_uuid = f'dry_run_sample_id_{sample["id"]}'
                # print(f"Dry run: Successfully created sample with legacy id: {sample['id']}")
            else: 
                sample_entity = create_entity_metadata(new_project_id, constants.SAMPLE, sample_data)
                sample_uuid = sample_entity.uuid
                parent_node = get_root_node(new_project_id)
                add_node_to_project(new_project_id, parent_node['id'], sample_uuid, constants.SAMPLE, sample_entity.value['name'])


            sample_mappings[sample['id']] = {'sample_uuid': sample_uuid, 'path': f'{sample["name"]}'}

        return sample_mappings
    
    def get_file_objs(self, files, path, project_id):

        file_objs = []
        client = service_account()

        directory_cache = {}

        for file in files:

            file_name = Path(file['file']).name

            if file['isAdvancedImageFile'] == 1:
                advanced_image_file = query_advanced_file_metadata(file['id'])[0]
                
                value = {
                    'data_type': 'file',
                    'is_advanced_image_file': True,
                    'name': file_name,
                    'image_type': metadata_mappings.FILE_IMAGE_TYPE_MAPPING.get(advanced_image_file['image_type']),
                    'height': advanced_image_file['height'],
                    'width': advanced_image_file['width'],
                    'number_of_images': advanced_image_file['numberOfImages'],
                    'offset_to_first_image': advanced_image_file['offsetToFirstImage'],
                    'gap_between_images': advanced_image_file['gapBetweenImages'],
                    'byte_order': metadata_mappings.FILE_BYTE_ORDER_MAPPING.get(advanced_image_file['byteOrder']),
                    'use_binary_correction': metadata_mappings.FILE_USE_BINARY_CORRECTION_MAPPING.get(advanced_image_file['use_binary_correction']),
                }

                file_obj = create_file_obj(project_id, file_name, None, f'{path}/{file_name}', value)
                file_obj.legacy_path = file['file']
                file_objs.append(file_obj)

                # Find and add the generated image files for this advanced file 
                file_parent_path = Path(file['file']).parent

                if file_parent_path not in directory_cache:
                    try:
                        directory_cache[file_parent_path] = client.files.listFiles(systemId='cloud.data', 
                                                                                path = f'/corral-repl/utexas/pge-nsf/media/{file_parent_path}')
                    except Exception as e:
                        print(f"Error listing files in directory {file_parent_path}: {e}")
                        continue

                files_in_parent_path = directory_cache[file_parent_path]
                
                generated_files = [gen_file for gen_file in files_in_parent_path 
                                   if gen_file.name.startswith(file_name) and gen_file.name != file_name]

                for gen_file in generated_files:
                    gen_file_obj = create_file_obj(project_id, gen_file.name, None, f'{path}/{gen_file.name}', { 'data_type': 'file' })
                    gen_file_obj.legacy_path = f'{file_parent_path}/{gen_file.name}'
                    file_objs.append(gen_file_obj)

            else: 
                file_obj = create_file_obj(project_id, file_name, None, f'{path}/{file_name}', { 'data_type': 'file' })
                file_obj.legacy_path = file['file']
                file_objs.append(file_obj)

        return file_objs
    
    def migrate_origin_data(self, project_mapping, sample_mappings):
        """Migrates origin datasets and adds them to the project graph."""

        legacy_project_id, new_project_id = project_mapping

        origin_data_mappings = {}

        for legacy_sample_id, new_sample in sample_mappings.items():
            for origin in query_origin_data(legacy_project_id, legacy_sample_id):

                is_segmented = metadata_mappings.ORIGIN_DATA_IS_SEGMENTED_MAPPING.get(origin['is_segmented'])
                voxel_unit = metadata_mappings.ORIGIN_DATA_VOXEL_UNIT_MAPPING.get(origin['voxel_units'])

                new_sample_uuid = new_sample['sample_uuid']
                new_sample_path = new_sample['path']

                files = query_files(origin['id'], None)

                file_objs = self.get_file_objs(files, f"{new_sample_path}/{origin['name']}", new_project_id)

                origin_data = {
                    "name": origin['name'],
                    "description": origin.get('provenance', ''),
                    "data_type": "digital_dataset",
                    "is_segmented": is_segmented,
                    "sample": new_sample_uuid,
                    "voxel_x": origin.get('voxel_x'),
                    "voxel_y": origin.get('voxel_y'),
                    "voxel_z": origin.get('voxel_z'),
                    "voxel_units": voxel_unit,
                    "external_uri": origin.get('external_url'),
                    "file_objs": file_objs,
                }

                if self.dry_run: 
                    validated_origin = SCHEMA_MAPPING[constants.DIGITAL_DATASET].model_validate(origin_data)
                    origin_uuid = f'dry_run_origin_id_{origin["id"]}'
                    # print(f"Dry run: Successfully created origin data with legacy id: {origin['id']}")
                else:
                    new_origin = create_entity_metadata(
                        project_id=new_project_id,
                        name=constants.DIGITAL_DATASET,
                        value=origin_data
                    )
                    origin_uuid = new_origin.uuid
                    parent_node = get_node_from_uuid(new_project_id, new_sample_uuid)
                    add_node_to_project(new_project_id, parent_node['id'], origin_uuid, constants.DIGITAL_DATASET, new_origin.value['name'])
                    add_file_associations(origin_uuid, file_objs)

                origin_data_mappings[origin['id']] = {'origin_data_uuid': origin_uuid, 'path': f'{new_sample_path}/{origin["name"]}',
                                                      'sample_id': legacy_sample_id}

        return origin_data_mappings

    def migrate_analysis_dataset(self, project_mapping, sample_mappings, origin_data_mappings):

        legacy_project_id, new_project_id = project_mapping
        analysis_data_mappings = {}

        for analysis in query_analysis_data(legacy_project_id):
            new_sample = sample_mappings.get(analysis['sample_id'])
            new_origin_data = origin_data_mappings.get(analysis['base_origin_data_id'])

            if not new_sample: 
                if new_origin_data:
                    new_sample = sample_mappings.get(new_origin_data['sample_id'])
                else: 
                    print(f'No sample found for analysis {analysis["id"]}. Skipping.')
                    continue

            dataset_type = metadata_mappings.ANALYSIS_DATA_TYPE_MAPPING.get(analysis['type'])

            files = query_files(None, analysis['id'])

            analysis_data_path = f"{new_origin_data['path']}/{analysis['name']}" if new_origin_data else f"{new_sample['path']}/{analysis['name']}"

            file_objs = self.get_file_objs(files, analysis_data_path, new_project_id)

            analysis_data = {
                "name": analysis['name'],
                "description": analysis.get('description', ''),
                "data_type": "analysis_data",
                "is_segmented": "no",
                "dataset_type": dataset_type,
                "sample": new_sample['sample_uuid'],
                "digital_dataset": new_origin_data['origin_data_uuid'] if new_origin_data else None,
                "external_uri": analysis.get('external_url'),
                "file_objs": file_objs,
            }

            if self.dry_run:
                validated_analysis = SCHEMA_MAPPING[constants.ANALYSIS_DATA].model_validate(analysis_data)
                analysis_uuid = f'dry_run_analysis_id_{analysis["id"]}'
                # print(f"Dry run: Successfully created analysis data with legacy id: {analysis['id']}")
            else: 
                new_analysis = create_entity_metadata(
                    project_id=new_project_id,
                    name=constants.ANALYSIS_DATA,
                    value=analysis_data
                )
                analysis_uuid = new_analysis.uuid
                parent_node = get_node_from_uuid(new_project_id, new_origin_data['origin_data_uuid'] if new_origin_data else new_sample['sample_uuid'])
                add_node_to_project(new_project_id, parent_node['id'], analysis_uuid, constants.ANALYSIS_DATA, new_analysis.value['name'])
                add_file_associations(analysis_uuid, file_objs)

            analysis_data_mappings[analysis['id']] = {'analysis_data_uuid': analysis_uuid, 'path': analysis_data_path}

        return analysis_data_mappings