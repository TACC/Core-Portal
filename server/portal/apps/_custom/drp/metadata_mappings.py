"""Mapping of metadata fields from old DRP database to new DRP metadata model."""

SAMPLE_POROUS_MEDIA_TYPE_MAPPINGS = {
    'Beads': 'beads',
    'BEAD': 'beads',
    'Sandstone': 'sandstone',
    'SAND': 'sandstone',
    'CARB': 'carbonate',
    'SOIL': 'soil',
    'FIBR': 'fibrous_media',
    'GRAN': 'granite',
    'COAL': 'coal',
    'Other': 'other',
    'OTHE': 'other',
}

SAMPLE_SOURCE_MAPPINGS = {
    'Artificial': 'artificial',
    'A': 'artificial',
    'Natural': 'natural',
    'N': 'natural',
}

ORIGIN_DATA_IS_SEGMENTED_MAPPING = {
    1: 'yes',
    2: 'no'
}

ORIGIN_DATA_VOXEL_UNIT_MAPPING = {
    'micrometer': 'micrometer',
    'um': 'micrometer',
    'mm': 'millimeter',
    'nm': 'nanometer',
    'other': 'other'
}

ANALYSIS_DATA_TYPE_MAPPING = {
    'Simulation': 'simulation',
    'GeometricAnalysis': 'geometric_analysis',
    'Other': 'other',
}

FILE_IMAGE_TYPE_MAPPING = {
    '8-bit': '8_bit',
    '64-bit Real': '64_bit_real',
    '16-bit Unsigned': '16_bit_unsigned',
    '32-bit Real': '32_bit_real',
    '32-bit Signed': '32_bit_signed',
    '24-bit RGB': '24_bit_rgb',
    '32-bit Unsigned': '32_bit_unsigned',
}

FILE_BYTE_ORDER_MAPPING = {
    'little-endian': 'little_endian',
    'big-endian': 'big_endian',
}

FILE_USE_BINARY_CORRECTION_MAPPING = {
    1: True,
    0: False,
}