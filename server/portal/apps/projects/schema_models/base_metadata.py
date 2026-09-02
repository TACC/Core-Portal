"""Portal-agnostic base Pydantic models for the project metadata graph."""

from functools import partial
from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class BaseMetadataModel(BaseModel):
    """Base config shared by every metadata model (camelCase serialization)."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        extra="forbid",
        coerce_numbers_to_str=True,
    )

    def model_dump(self, *args, **kwargs):
        # default by_alias to true for camelCase serialization
        return partial(super().model_dump, by_alias=True, exclude_none=True)(*args, **kwargs)


class BaseFileMetadata(BaseMetadataModel):
    """Generic metadata attached to a file entity."""

    model_config = ConfigDict(extra="ignore")

    data_type: Literal["file"]
    name: str | None = None


class FileObj(BaseMetadataModel):
    """A file associated with a project graph entity."""

    system: str
    name: str
    path: str
    legacy_path: str | None = None
    type: Literal["file", "dir"]
    length: int | None = None
    last_modified: str | None = None
    uuid: str | None = None
    value: dict | None = None


class PartialTrashEntity(BaseMetadataModel):
    """Model for representing a trash entity."""

    model_config = ConfigDict(extra="ignore")


class PartialEntityWithFiles(BaseMetadataModel):
    """Model for representing an entity with associated files."""

    model_config = ConfigDict(extra="ignore")

    file_objs: list[FileObj] = []


class ProjectRelatedDatasets(BaseMetadataModel):
    """A dataset related to a project."""

    dataset_title: str
    dataset_description: str | None = None
    dataset_link: str = ""


class ProjectRelatedSoftware(BaseMetadataModel):
    """Software related to a project."""

    software_title: str
    software_description: str = ""
    software_link: str = ""


class ProjectRelatedPublications(BaseMetadataModel):
    """A publication related to a project."""

    publication_type: Literal["context", "linked_dataset", "cited_by"]
    publication_title: str
    publication_link: str
    publication_author: str | None = None
    publication_doi: str | None = None
    publication_date_of_publication: str | None = None
    publication_publisher: str | None = None
    publication_description: str | None = None


class GuestUser(BaseMetadataModel):
    """A guest collaborator granted access to a project."""

    first_name: str
    last_name: str
    email: str


class BaseProjectMetadata(BaseMetadataModel):
    """Generic project entity metadata.

    Holds the full set of standard project fields (all optional beyond
    project_id/title). Portals can narrow which fields are shown/required via
    settings_forms.
    """

    project_id: str
    title: str
    description: str = ""
    license: str | None = None
    doi: str | None = None
    institution: str | None = None
    keywords: str | list[str] | None = None
    related_datasets: list[ProjectRelatedDatasets] = []
    related_software: list[ProjectRelatedSoftware] = []
    related_publications: list[ProjectRelatedPublications] = []
    publication_date: str | None = None
    authors: list[dict] = []
    file_objs: list[FileObj] = []
    is_review_project: bool | None = None
    is_published_project: bool | None = None
    guest_users: list[GuestUser] = []
    cover_image: str | None = None
