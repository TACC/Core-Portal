from typing import Literal

from pydantic import ConfigDict, NonNegativeFloat, NonNegativeInt

from portal.apps.projects.schema_models.base_metadata import (
    BaseFileMetadata,
    BaseMetadataModel,
    BaseProjectMetadata,
    FileObj,
)

"""
Pydantic models for DRP Metadata.
"""


class DrpFileMetadata(BaseFileMetadata):
    """Model for DRP File Metadata"""

    model_config = ConfigDict(
        extra="forbid",
    )

    is_advanced_image_file: bool | None = False
    image_type: (
        Literal[
            "8_bit",
            "16_bit_signed",
            "16_bit_unsigned",
            "32_bit_signed",
            "32_bit_unsigned",
            "32_bit_real",
            "64_bit_real",
            "24_bit_rgb",
            "24_bit_rgb_planar",
            "24_bit_bgr",
            "24_bit_integer",
            "32_bit_argb",
            "32_bit_abgr",
            "1_bit_bitmap",
        ]
        | None
    ) = None
    height: NonNegativeInt | None = None
    width: NonNegativeInt | None = None
    number_of_images: NonNegativeInt | None = None
    offset_to_first_image: int | None = None
    gap_between_images: int | None = None
    byte_order: Literal["big_endian", "little_endian"] | None = None
    use_binary_correction: bool | None = None


class DrpProjectMetadata(BaseProjectMetadata):
    license: str | None = "ODC-BY 1.0"


class DrpDatasetMetadata(BaseMetadataModel):
    """Model for Base DRP Dataset Metadata"""

    model_config = ConfigDict(
        extra="forbid",
    )

    name: str
    description: str | None = None
    uuid: str | None = None
    data_type: Literal["sample", "origin_data", "digital_dataset", "analysis_data", "file"]
    file_objs: list[FileObj] = []


class DrpSampleMetadata(DrpDatasetMetadata):
    """Model for DRP Sample Metadata"""

    porous_media_type: Literal["sandstone", "soil", "carbonate", "granite", "beads", "fibrous_media", "coal", "energy_storage", "other"]

    porous_media_other_description: str | None = None

    source: Literal[
        "natural",
        "natural_extraterrestrial",
        "artificial",
        "computer_generated",
    ]
    collection_method: str | None = None
    onshore_offshore: Literal["onshore", "offshore"] | None = None
    depth: str | None = None
    total_vertical_depth: str | None = None
    water_depth: str | None = None
    geographic_origin: str | None = None
    procedure: str | None = None
    equipment: str | None = None
    algorithm_description: str | None = None
    grain_size_min: NonNegativeFloat | None = None
    grain_size_max: NonNegativeFloat | None = None
    grain_size_avg: NonNegativeFloat | None = None
    grain_size_units: Literal["nanometer", "micrometer", "millimeter", "other"] | None = None
    porosity: float | None = None
    geographical_location: str | None = None
    date_of_collection: str | None = None
    date_of_creation: str | None = None
    identifier: str | None = None
    location: str | None = None  # TODO_DRP: Remove in new model


class DrpOriginDatasetMetadata(DrpDatasetMetadata):
    """Model for DRP Origin Dataset Metadata"""

    is_segmented: Literal["yes", "no"]
    sample: str
    imaging_center: str | None = None
    imaging_equipment_and_model: str | None = None
    image_format: str | None = None
    image_dimensions: str | None = None
    image_byte_order: str | None = None
    voxel_x: NonNegativeFloat | None = None
    voxel_y: NonNegativeFloat | None = None
    voxel_z: NonNegativeFloat | None = None
    voxel_units: Literal["nanometer", "micrometer", "millimeter", "other"] | None = None
    dimensionality: str | None = None
    digital_dataset: str | None = None
    external_uri: str | None = None  # TODO_DRP: Remove in new model


class DrpAnalysisDatasetMetadata(DrpDatasetMetadata):
    """Model for DRP Analysis Dataset Metadata"""

    is_segmented: Literal["yes", "no"]
    dataset_type: Literal["machine_learning", "simulation", "geometric_analysis", "experimental", "characterization", "other"]
    external_uri: str | None = None
    sample: str
    # base_origin_data: Optional[str] = None
    digital_dataset: str | None = None
    digital_dataset_other_information: str | None = None
