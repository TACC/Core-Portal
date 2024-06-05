from pydantic import BaseModel, ConfigDict, model_validator
from typing import Optional, Literal


class DrpProjectRelatedDatasets(BaseModel):
    """Model for DRP Project Related Datasets"""
    
    model_config = ConfigDict(
        extra="forbid",
    )

    title: str
    description: str = ""
    link: str = ""

class DrpProjectRelatedSoftware(BaseModel):
    """Model for DRP Project Related Software"""

    model_config = ConfigDict(
        extra="forbid",
    )

    title: str
    description: str = ""
    link: str = ""

class DrpProjectRelatedPublications(BaseModel):
    """Model for DRP Project Related Publications"""

    model_config = ConfigDict(
        extra="forbid",
    )

    title: str
    author: str
    date_of_publication: str
    publisher: str
    abstract: Optional[str] = None
    link: Optional[str] = None


class DrpProjectMetadata(BaseModel):
    """Model for DRP Project Metadata"""

    model_config = ConfigDict(
        extra="forbid",
    )

    title: str
    description: str = ""
    license: Optional[str] = None
    doi: Optional[str] = None
    related_datasets: list[DrpProjectRelatedDatasets] = []
    related_software: list[DrpProjectRelatedSoftware] = []
    related_publications: list[DrpProjectRelatedPublications] = []
    publication_date: Optional[str] = None


class DrpDatasetMetadata(BaseModel):
    """Model for Base DRP Dataset Metadata"""

    model_config = ConfigDict(
        extra="forbid",
    )

    name: str
    description: str
    data_type: Literal[
        "sample", 
        "origin_data",
        "analysis_data",
        "file"
    ]

class DrpSampleMetadata(DrpDatasetMetadata):
    """Model for DRP Sample Metadata"""

    porous_media_type: Literal[
        "sandstone",
        "soil",
        "carbonate",
        "greanite",
        "beads",
        "fibrous_media",
        "coal", 
        "energy_storage",
        "other"
    ]
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
    grain_size_min: Optional[str] = None
    grain_size_max: Optional[str] = None
    grain_size_avg: Optional[str] = None
    porosity: Optional[str] = None
    geographical_location: Optional[str] = None
    date_of_collection: Optional[str] = None
    identifier: Optional[str] = None


class DrpOriginDatasetMetadata(DrpDatasetMetadata):
    """Model for DRP Origin Dataset Metadata"""

    is_segmented: bool
    voxel_x: Optional[float] = None
    voxel_y: Optional[float] = None
    voxel_z: Optional[float] = None
    voxel_units: Optional[Literal[
        "nanometer",
        "micrometer",
        "millimeter",
        "other"
    ]] = None
    sample: str
    imaging_center: Optional[str] = None
    imaging_equipment_and_model: Optional[str] = None
    image_format: Optional[str] = None
    image_dimensions: Optional[str] = None
    image_byte_order: Optional[str] = None
    dimensionality: Optional[str] = None

class DrpAnalysisDatasetMetadata(BaseModel):
    """Model for DRP Analysis Dataset Metadata"""

    is_segmented: bool
    sample: str
    base_origin_data: Optional[str] = None
    analysis_type: Literal[
        "machine_learning",
        "simulation",
        "experimental",
        "characterization",
        "other"
    ]
