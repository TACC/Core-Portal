"""Utiity models used in multiple field types"""

from datetime import datetime
from functools import partial
from typing import Annotated, Literal, Optional
from pydantic import AliasChoices, BaseModel, BeforeValidator, ConfigDict, Field
from pydantic.alias_generators import to_camel
from django.contrib.auth import get_user_model
from pytas.http import TASClient

class FileObj(BaseModel):
    """Model for associated files"""

    system: str
    name: str
    path: str
    type: Literal["file", "dir"]
    length: Optional[int] = None
    last_modified: Optional[str] = None
    uuid: Optional[str] = None

class PartialEntityWithFiles(BaseModel):
    """Model for representing an entity with associated files."""

    model_config = ConfigDict(extra="ignore")

    # file_tags: list[FileTag] = []
    file_objs: list[FileObj] = []
