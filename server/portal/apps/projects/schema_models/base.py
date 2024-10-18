"""Utiity models used in multiple field types"""

from datetime import datetime
from functools import partial
from typing import Annotated, Literal, Optional
from pydantic import AliasChoices, BaseModel, BeforeValidator, ConfigDict, Field
from pydantic.alias_generators import to_camel
from django.contrib.auth import get_user_model
from pytas.http import TASClient
from portal.apps._custom.drp.models import DrpMetadataModel


