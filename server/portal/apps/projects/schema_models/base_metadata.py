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


class BaseProjectMetadata(BaseMetadataModel):
    """Generic project entity metadata."""

    model_config = ConfigDict(extra="ignore")

    project_id: str
    title: str
    description: str = ""
    keywords: Optional[str | list[str]] = None
    authors: list[dict] = []
    file_objs: list[FileObj] = []
    is_review_project: Optional[bool] = None
    is_published_project: Optional[bool] = None
    cover_image: Optional[str] = None
