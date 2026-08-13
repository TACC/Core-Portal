"""Portal-agnostic base Pydantic models for the project metadata graph."""

from functools import partial
from typing import Literal, Optional

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
        return partial(super().model_dump, by_alias=True, exclude_none=True)(
            *args, **kwargs
        )


class BaseFileMetadata(BaseMetadataModel):
    """Generic metadata attached to a file entity."""

    model_config = ConfigDict(extra="ignore")

    data_type: Literal["file"]
    name: Optional[str] = None


class FileObj(BaseMetadataModel):
    """A file associated with a project graph entity."""

    system: str
    name: str
    path: str
    legacy_path: Optional[str] = None
    type: Literal["file", "dir"]
    length: Optional[int] = None
    last_modified: Optional[str] = None
    uuid: Optional[str] = None
    value: Optional[dict] = None


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
    dataset_description: Optional[str] = None
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
    publication_author: Optional[str] = None
    publication_doi: Optional[str] = None
    publication_date_of_publication: Optional[str] = None
    publication_publisher: Optional[str] = None
    publication_description: Optional[str] = None


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
    license: Optional[str] = None
    doi: Optional[str] = None
    institution: Optional[str] = None
    keywords: Optional[str | list[str]] = None
    related_datasets: list[ProjectRelatedDatasets] = []
    related_software: list[ProjectRelatedSoftware] = []
    related_publications: list[ProjectRelatedPublications] = []
    publication_date: Optional[str] = None
    authors: list[dict] = []
    file_objs: list[FileObj] = []
    is_review_project: Optional[bool] = None
    is_published_project: Optional[bool] = None
    guest_users: list[GuestUser] = []
    cover_image: Optional[str] = None
