from pydantic import BaseModel, ConfigDict, model_validator
from typing import Optional, Literal
from pydantic.alias_generators import to_camel
from functools import partial

"""
Pydantic models for DRP Metadata
"""

class DrpMetadataModel(BaseModel):
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
    
class DrpFileMetadata(DrpMetadataModel):
    """Model for DRP File Metadata"""

    model_config = ConfigDict(
        extra="forbid",
    ) 

    data_type: Literal['file']
    name: Optional[str] = None
    image_type: Optional[Literal[
        '8_bit', '16_bit_signed', '16_bit_unsigned', '32_bit_signed', '32_bit_unsigned', '32_bit_real', '64_bit_real', 
        '24_bit_rgb', '24_bit_rgb_planar', '24_bit_bgr', '24_bit_integer', '32_bit_argb', '32_bit_abgr', '1_bit_bitmap',
    ]] = None
    height: Optional[int] = None
    width: Optional[int] = None
    number_of_images: Optional[int] = None
    offset_to_first_image: Optional[int] = None
    gap_between_images: Optional[int] = None
    byte_order: Optional[Literal['big_endian', 'little_endian']] = None

class FileObj(DrpMetadataModel):
    """Model for associated files"""

    system: str
    name: str
    path: str
    type: Literal["file", "dir"]
    length: Optional[int] = None
    last_modified: Optional[str] = None
    uuid: Optional[str] = None
    value: Optional[DrpFileMetadata] = None

class PartialTrashEntity(DrpMetadataModel):
    """Model for representing a trash entity."""

    model_config = ConfigDict(extra="ignore")
class PartialEntityWithFiles(DrpMetadataModel):
    """Model for representing an entity with associated files."""

    model_config = ConfigDict(extra="ignore")

    # file_tags: list[FileTag] = []
    file_objs: list[FileObj] = []
class DrpProjectRelatedDatasets(DrpMetadataModel):
    """Model for DRP Project Related Datasets"""

    model_config = ConfigDict(
        extra="forbid",
    )

    dataset_title: str
    dataset_description: str = ""
    dataset_link: str = ""

class DrpProjectRelatedSoftware(DrpMetadataModel):
    """Model for DRP Project Related Software"""

    model_config = ConfigDict(
        extra="forbid",
    )

    software_title: str
    software_description: str = ""
    software_link: str = ""

class DrpProjectRelatedPublications(DrpMetadataModel):
    """Model for DRP Project Related Publications"""

    model_config = ConfigDict(
        extra="forbid",
    )

    publication_title: str
    publication_author: str
    publication_date_of_publication: str
    publication_publisher: str
    publication_description: Optional[str] = None
    publication_link: Optional[str] = None

class DrpProjectMetadata(DrpMetadataModel):
    """Model for DRP Project Metadata"""

    model_config = ConfigDict(
        extra="forbid",
    )

    project_id: str
    title: str
    description: str = ""
    license: Optional[str] = None
    doi: Optional[str] = None
    keywords: Optional[str] = None
    related_datasets: list[DrpProjectRelatedDatasets] = []
    related_software: list[DrpProjectRelatedSoftware] = []
    related_publications: list[DrpProjectRelatedPublications] = []
    publication_date: Optional[str] = None
    authors: list[dict] = []
    file_objs: list[FileObj] = []
    is_review_project: Optional[bool] = None
    is_published_project: Optional[bool] = None

class DrpDatasetMetadata(DrpMetadataModel):
    """Model for Base DRP Dataset Metadata"""

    model_config = ConfigDict(
        extra="forbid",
    )

    name: str
    description: str
    data_type: Literal[
        "sample", 
        "origin_data",
        "digital_dataset",
        "analysis_data",
        "file"
    ]
    file_objs: list[FileObj] = []

class DrpSampleMetadata(DrpDatasetMetadata):
    """Model for DRP Sample Metadata"""

    porous_media_type: Literal[
        "sandstone",
        "soil",
        "carbonate",
        "granite",
        "beads",
        "fibrous_media",
        "coal", 
        "energy_storage",
        "other"
    ]

    porous_media_other_description: Optional[str] = None

    source: Literal[
        "natural",
        "natural_extraterrestrial",
        "artificial",
        "computer_generated",
    ]
    collection_method: Optional[str] = None
    onshore_offshore: Optional[Literal["onshore", "offshore"]] = None
    depth: Optional[str] = None
    water_depth: Optional[str] = None
    geographic_origin: Optional[str] = None
    procedure: Optional[str] = None
    equipment: Optional[str] = None
    algorithm_description: Optional[str] = None
    grain_size_min: Optional[float] = None
    grain_size_max: Optional[float] = None
    grain_size_avg: Optional[float] = None
    porosity: Optional[float] = None
    geographical_location: Optional[str] = None
    date_of_collection: Optional[str] = None
    identifier: Optional[str] = None
    location: Optional[str] = None # TODO_DRP: Remove in new model

class DrpOriginDatasetMetadata(DrpDatasetMetadata):
    """Model for DRP Origin Dataset Metadata"""

    is_segmented: Literal["yes", "no"]
    sample: str
    imaging_center: Optional[str] = None
    imaging_equipment_and_model: Optional[str] = None
    image_format: Optional[str] = None
    image_dimensions: Optional[str] = None
    image_byte_order: Optional[str] = None
    voxel_x: Optional[float] = None
    voxel_y: Optional[float] = None
    voxel_z: Optional[float] = None
    voxel_units: Optional[Literal[
        "nanometer",
        "micrometer",
        "millimeter",
        "other"
    ]] = None
    dimensionality: Optional[str] = None
    external_uri: Optional[str] = None # TODO_DRP: Remove in new model

class DrpAnalysisDatasetMetadata(DrpDatasetMetadata):
    """Model for DRP Analysis Dataset Metadata"""

    is_segmented: Literal["yes", "no"]
    dataset_type: Literal[
        "machine_learning",
        "simulation",
        "geometric_analysis",
        "experimental",
        "characterization",
        "other"
    ]
    external_uri: Optional[str] = None
    sample: str
    # base_origin_data: Optional[str] = None
    digital_dataset: Optional[str] = None
