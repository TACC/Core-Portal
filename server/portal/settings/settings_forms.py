SAMPLE_FORM_FIELDS = [
    {
        "name": "name",
        "label": "Name",
        "type": "text",
        "validation": {
            "required": True,
            "pathSafe": True
        }
    },
    # {
    #     "name": "description",
    #     "label": "Description",
    #     "type": "textarea",
    #     "validation": {
    #         "required": True
    #     }
    # },
    {
        "name": "porous_media_type",
        "label": "Porous Media Type",
        "type": "select",
        "options": [
            {
                "label": "",
                "value": ""
            },
            {
                "label": "Sandstone",
                "value": "sandstone",
            },
            {
                "label": "Soil",
                "value": "soil",
            },
            {
                "label": "Carbonate",
                "value": "carbonate",
            },
            {
                "label": "Granite",
                "value": "granite",
            },
            {
                "label": "Beads",
                "value": "beads",
            },
            {
                "label": "Fibrous Media",
                "value": "fibrous_media",
            },
            {
                "label": "Coal",
                "value": "coal",
            },
            {
                "label": "Energy Storage",
                "value": "energy_storage",
            },
            {
                "label": "Other",
                "value": "other",
            }
        ],
        "validation": {
            "required": True
        }
    },
    {
        "name": "porous_media_other_description",
        "label": "Porous Media Other Description",
        "type": "text",
        "description": "Other porous media type description",
        "dependency": {
            "type": "visibility",
            "name": "porous_media_type",
            "value": "other",
        },
        "hidden": True,
        "validation": {
            "min": 50,
            "max": 5000,
        },
    },
    {
        "name": "source",
        "label": "Source",
        "type": "select",
        "options": [
            {
                "label": "",
                "value": ""
            },
            {
                "label": "Natural (Earth) [The sample is an earth-based naturally occurring material.]",
                "value": "natural",
            },
            {
                "label": "Natural (Extraterrestrial) [The sample is a non-earth based naturally occurring material.]",
                "value": "natural_extraterrestrial",
            },
            {
                "label": "Artificial (Human-Made) [The sample is artificially generated without any computer intervention.]",
                "value": "artificial",
            },
            {
                "label": "Computer Generated [The sample is artificially generated using a computer algorithm or a computer-based operation.]",
                "value": "computer_generated",
            }

        ],
        "validation": {
            "required": True
        }
    },
    {
        "name": "collection_method",
        "label": "Collection Method",
        "type": "text",
        "dependency": {
            "type": "visibility",
            "name": "source",
            "value": ["natural", "natural_extraterrestrial"],
        },
        "hidden": True,
        "description": "How the sample was collected?"
    },
    {
        "name": "onshore_offshore",
        "label": "Onshore/Offshore",
        "type": "select",
        "options": [
            {
                "label": "",
                "value": ""
            },
            {
                "label": "Onshore [The depth at which the sample is extracted.]",
                "value": "onshore",
            },
            {
                "label": "Offshore [The total vertical depth along with water depth.]",
                "value": "offshore",
            }
        ],
        "dependency": {
            "type": "visibility",
            "name": "source",
            "value": "natural",
        },
        "hidden": True,
        "description": "Whether the sample occurs in an onshore or offshore environment in nature."
    },
    {
        "name": "depth",
        "label": "Depth",
        "type": "text",
        "dependency": {
            "type": "visibility",
            "name": "onshore_offshore",
            "value": "onshore",
        },
        "hidden": True,
    },
    {
        "name": "total_vertical_depth",
        "label": "Total Vertical Depth",
        "type": "text",
        "dependency": {
            "type": "visibility",
            "name": "onshore_offshore",
            "value": "offshore",
        },
        "hidden": True,
    },
    {
        "name": "water_depth",
        "label": "Water Depth",
        "type": "text",
        "dependency": {
            "type": "visibility",
            "name": "onshore_offshore",
            "value": "offshore",
        },
        "hidden": True,
    },
    {
        "name": "geographic_origin",
        "label": "Geographic Origin",
        "type": "text",
        "dependency": {
                "type": "visibility",
                "name": "source",
                "value": ["natural", "natural_extraterrestrial"]
            },
        "hidden": True,
        "description": "If Natural (Earth), the sample is a non-earth based naturally occurring material. If Natural (Extraterrestrial), the celestial body/astronomical object."
    },
    {
        "name": "procedure",
        "label": "Procedure",
        "type": "text",
        "dependency": {
            "type": "visibility",
            "name": "source",
            "value": "artificial",
        },
        "hidden": True,
        "description": "The lab procedure used to generate the sample.",
    },
    {
        "name": "equipment",
        "label": "Equipment",
        "type": "text",
        "dependency": {
            "type": "visibility",
            "name": "source",
            "value": "artificial",
        },
        "hidden": True,
        "description": "The lab equipment used for creating the sample. Models and versions of equipment can also be provided.",
    },
    {
        "name": "algorithm_description",
        "label": "Algorithm Description",
        "type": "textarea",
        "dependency": {
            "type": "visibility",
            "name": "source",
            "value": "computer_generated",
        },
        "hidden": True,
        "validation": {
            "min": 50,
            "max": 5000,
        },
        "description": "Function of the algorithm used to generate the sample. In addition, an existing or a new algorithm is used as a code or software, it can be linked to the “Related Software” part of the “Dataset”."
    },
    {
        "name": "grain_size_min",
        "label": "Grain Size Min",
        "type": "number",
        "description": "Enter consistent numbers; units can be specified below.",
        "validation": {
            "min": 0,
        }
    },
    {
        "name": "grain_size_max",
        "label": "Grain Size Max",
        "type": "number",
        "description": "Enter consistent numbers; units can be specified below.",
        "validation": {
            "min": 0,
        }
    },
    {
        "name": "grain_size_avg",
        "label": "Grain Size Avg",
        "type": "number",
        "description": "Enter consistent numbers; units can be specified below.",
        "validation": {
            "min": 0,
        }
    },
    {
        "name": "grain_size_units",
        "label": "Grain Size Units",
        "type": "select",
        "options": [
            {
                "label": "",
                "value": ""
            },
            {
                "label": "Nanometer",
                "value": "nanometer"
            },
            {
                "label": "Micrometer",
                "value": "micrometer"
            },
            {
                "label": "Millimeter",
                "value": "millimeter"
            },
            {
                "label": "Other",
                "value": "other"
            }
        ]
    },
    {
        "name": "porosity",
        "label": "Porosity",
        "type": "number",
        "step": "0.01",
        "description": "Please enter as a real number between 0 and 1.",
        "validation": {
            "min": 0,
            "max": 1,
        }
    },
    {
        "name": "geographical_location",
        "label": "Geographical Location",
        "type": "text",
        "description": "The location where the sample was obtained. If the sample is computer generated and is in a research center database, provide the name and the location of the research center.",
    },
    {
        "name": "date_of_collection",
        "label": "Date of Collection",
        "type": "text",
            "dependency": {
            "type": "visibility",
            "name": "source",
            "value": ["natural", "natural_extraterrestrial"],
        },
        "hidden": True,
        "description": "The date that the sample was collected.",
    },
    {
        "name": "date_of_creation",
        "label": "Date of Creation",
        "type": "text",
            "dependency": {
            "type": "visibility",
            "name": "source",
            "value": ["computer_generated", "artificial"],
        },
        "hidden": True,
        "description": "The date that the sample was created/generated."
    },
    {
        "name": "identifier",
        "label": "Identifier",
        "type": "text",
        "description": "Enter any known (physical) sample ID and/or link if available.",
    },
    {
        "name": "description",
        "label": "Other Information",
        "type": "textarea",
        "validation": {
            "min": 50,
            "max": 5000,
        },
        "description": "Information that the authors find relevant to the sample, such as the reason for the selection of the sample in relation to the research.",
    },
]

ORIGIN_DATASET_FORM_FIELDS = [
    {
        "name": "name",
        "label": "Name",
        "type": "text",
        "validation": {
            "required": True,
            "pathSafe": True
        }
    },
    {
        "name": "is_segmented",
        "label": "Is Segmented",
        "type": "radio",
        "options": [
            {
                "label": "Yes",
                "value": "yes",
            },
            {
                "label": "No",
                "value": "no",
            },
        ],
        "validation": {
            "required": True
        }
    },
    {
        "name": "sample",
        "label": "Reference Sample",
        "type": "select",
        "options": [
            {
                "label": "",
                "value": ""
            }
        ],
        "description": "The corresponding sample for this digital dataset.",
        "validation": {
            "required": True
        }
    },
    {
        "name": "imaging_center",
        "label": "Imaging Center",
        "type": "text",
        "dependency": {
            "type": "visibility",
            "name": "sample.source",
            "value": ["natural", "natural_extraterrestrial", "artificial"],
        },
        "hidden": True,
        "description": "The place where the sample was imaged.",
    },
    {
        "name": "imaging_equipment_and_model",
        "label": "Imaging Equipment & Model",
        "type": "text",
        "dependency": {
            "type": "visibility",
            "name": "sample.source",
            "value": ["natural", "natural_extraterrestrial", "artificial"],
        },
        "hidden": True,
        "description": "The name and the model of the imaging equipment.",
    },
    {
        "name": "image_format",
        "label": "Imaging Format",
        "type": "text",
        "dependency": {
            "type": "visibility",
            "name": "sample.source",
            "value": ["natural", "natural_extraterrestrial", "artificial", "computer_generated"],
        },
        "hidden": True,
        "description": "The image format (*.tiff, *.raw, etc…)",
    },
    # TODO_DRP: Figure out how these fields should be shown. For image dimensions and byte order, should they be shown as a single field or separate fields?
    {
        "name": "image_dimensions",
        "label": "Image Dimensions",
        "type": "text",
        "dependency": {
            "type": "visibility",
            "name": "sample.source",
            "value": ["natural", "natural_extraterrestrial", "artificial", "computer_generated"],
        },
        "hidden": True,
        "description": "Length, width, and height of the image (not necessary if the image format is *.tiff)",
    },
    {
        "name": "image_byte_order",
        "label": "Image Byte Order",
        "type": "text",
        "dependency": {
            "type": "visibility",
            "name": "sample.source",
            "value": ["natural", "natural_extraterrestrial", "artificial", "computer_generated"],
        },
        "hidden": True,
    },
    {
        "name": "voxel_x",
        "label": "Voxel X",
        "type": "number",
        "validation": {
            "min": 0,
        }
    },
    {
        "name": "voxel_y",
        "label": "Voxel Y",
        "type": "number",
        "validation": {
            "min": 0,
        }
    },
    {
        "name": "voxel_z",
        "label": "Voxel Z",
        "type": "number",
        "validation": {
            "min": 0,
        }
    },
    {
        "name": "voxel_units",
        "label": "Voxel Units",
        "type": "select",
        "options": [
            {
                "label": "",
                "value": ""
            },
            {
                "label": "Nanometer",
                "value": "nanometer"
            },
            {
                "label": "Micrometer",
                "value": "micrometer"
            },
            {
                "label": "Millimeter",
                "value": "millimeter"
            },
            {
                "label": "Other",
                "value": "other"
            }
        ]
    },
    {
        "name": "dimensionality",
        "label": "Dimensionality",
        "type": "text",
        "description": "Whether the data is 2D, 3D, 4D, or other.",
    },
    {
        "name": "digital_dataset",
        "label": "Reference Digital Dataset",
        "type": "text",
        "description": "The DOI or URI of an existing public dataset from DPMP or another repository that is used to generate the digital dataset."
    },
    {
        "name": "description",
        "label": "Other Information",
        "type": "textarea",
        "validation": {
            "min": 50,
            "max": 5000,
        },
        "description": "Information that the authors find relevant to the digital dataset, such as the mineral and fluid phases in it, labels for segmentation if it is segmented, etc."
    },
]

ANALYSIS_DATASET_FORM_FIELDS = [
    {
        "name": "name",
        "label": "Name",
        "type": "text",
        "validation": {
            "required": True,
            "pathSafe": True
        }
    },
    {
        "name": "is_segmented",
        "label": "Is Segmented",
        "type": "radio",
        "options": [
            {
                "label": "Yes",
                "value": "yes",
            },
            {
                "label": "No",
                "value": "no",
            },
        ],
        "validation": {
            "required": True
        }
    },
    {
        "name": "dataset_type",
        "label": "Analysis Type",
        "type": "select",
        "options": [
            {
                "label": "",
                "value": ""
            },
            {
                "label": "Machine Learning [The dataset includes the analysis results coming from machine learning, deep learning, reinforcement learning, or any type of artificial intelligence algorithm]",
                "value": "machine_learning"
            },
            {
                "label": "Simulation [The dataset includes numerical/analytical simulation results]",
                "value": "simulation",
            },
            {
                "label": "Geometric Analysis",
                "value": "geometric_analysis"
            },
            {
                "label": "Experimental [The dataset includes laboratory-based experiment results]",
                "value": "experimental"
            },
            {
                "label": "Characterization [The dataset includes digital characterization results]",
                "value": "characterization"
            },
            {
                "label": "Other [Specify the analysis type that the analysis dataset includes]",
                "value": "other"
            }
        ],
        "validation": {
            "required": True
        }
    },
    # {
    #     "name": "external_uri",
    #     "label": "External URI",
    #     "type": "text",
    #     "validation": {
    #         "required": True
    #     }
    # },
    {
        "name": "sample",
        "label": "Reference Sample",
        "type": "select",
        "options": [
            {
                "label": "",
                "value": ""
            }
        ],
        "validation": {
            "required": True
        },
        "description": "The sample that was analyzed."
    },
    {
        "name": "digital_dataset",
        "label": "Reference Digital Dataset",
        "type": "select",
        "options": [
            {
                "label": "",
                "value": ""
            },
        ],
        "dependency": {
             "type": "filter",
             "name": "sample",
         },
        "description": "The DOI or URI of an existing public dataset from DPMP or another repository that is used for the analysis dataset."
    },
    {
        "name": "digital_dataset_other_information",
        "label": "Digital Dataset Other",
        "type": "text",
        "dependency": {
            "type": "visibility",
            "name": "digital_dataset",
            "value": ["other"],
        },
        "hidden": True,
    },
    {
        "name": "description",
        "label": "Other Information",
        "type": "textarea",
        "validation": {
            "min": 50,
            "max": 5000,
        },
        "description": "Information that the authors find relevant to the analysis, such as the labels for segmentation, analysis details, etc."
    },
]

UPLOAD_FILE_FIELDS = [
    {
        "name": "image_type",
        "label": "Image Type",
        "type": "select",
        "options": [
            {
                "label": "",
                "value": ""
            },
            {
                "label": "8-bit",
                "value": "8_bit"
            },
            {
                "label": "16-bit Signed",
                "value": "16_bit_signed"
            },
            {
                "label": "16-bit Unsigned",
                "value": "16_bit_unsigned"
            },
            {
                "label": "32-bit Signed",
                "value": "32_bit_signed"
            },
            {
                "label": "32-bit Unsigned",
                "value": "32_bit_unsigned"
            },
            {
                "label": "32-bit Real",
                "value": "32_bit_real"
            },
            {
                "label": "64-bit Real",
                "value": "64_bit_real"
            },
            {
                "label": "24-bit RGB",
                "value": "24_bit_rgb"
            },
            {
                "label": "24-bit RGB Planar",
                "value": "24_bit_rgb_planar"
            },
            {
                "label": "24-bit BGR",
                "value": "24_bit_bgr"
            },
            {
                "label": "24-bit Integer",
                "value": "24_bit_integer"
            },
            {
                "label": "32-bit ARGB",
                "value": "32_bit_argb"
            },
            {
                "label": "32-bit ABGR",
                "value": "32_bit_abgr"
            },
            {
                "label": "1-bit Bitmap",
                "value": "1_bit_bitmap"
            }
        ]
    },
    {
        "name": "width",
        "label": "Width",
        "type": "number",
        "description": "Number of voxels in the X-direction",
        "validation": {
            "min": 0,
        }
    },
    {
        "name": "height",
        "label": "Height",
        "type": "number",
        "description": "Number of voxels in the Y-direction",
        "validation": {
            "min": 0,
        }
    },
    {
        "name": "number_of_images",
        "label": "Number of Images",
        "type": "number",
        "description": "Number of voxels in the Z-direction",
        "validation": {
            "min": 0,
        }
    },
    {
        "name": "offset_to_first_image",
        "label": "Offset to First Image",
        "type": "number"
    },
    {
        "name": "gap_between_images",
        "label": "Gap Between Images",
        "type": "number"
    },
    {
        "name": "byte_order",
        "label": "Byte Order",
        "type": "select",
        "options": [
            {
                "label": "",
                "value": ""
            },
            {
                "label": "Little Endian",
                "value": "little_endian"
            },
            {
                "label": "Big Endian",
                "value": "big_endian"
            }
        ],
        "description": "Big endian and little endian refers to the direction data (each bit in a byte of data, that is) was written in the binary array you are uploading. This depends on the machine that wrote the original data file. If you don't know this information, wait until the upload is done and review resulting .jpg or .gif files. Mixing up endian-ness of your data is one of the reasons why your data will not look right at the end of the upload, so change it as necessary."
    },
    {
        "name": "use_binary_correction",
        "label": "Use Binary Correction",
        "type": "select",
        "options": [
            {
                "label": "",
                "value": ""
            },
            {
                "label": "Yes",
                "value": True
            },
            {
                "label": "No",
                "value": False
            }
        ],
    }
]

_FORMS = {
    "ADD_PROJECT_ADDON": {
        "heading": "Add Project",
        "form_fields": [
            # {
            #     "name": "description",
            #     "label": "Project Description",
            #     "type": "textarea",
            #     "description": "Provide 200-300 words clearly describing the data as an independent output; do not copy related publication abstract.",
            # },
            {
                "name": "cover_image",
                "label": "Project Cover Image",
                "type": "file",
                "validation": {
                    "accept": ".jpg,.jpeg,.png,.gif",
                }
            },
        ],
        "footer": {
            "fields": [
                {
                    "name": "edit_project",
                    "label": "Update Changes",
                    "type": "submit"
                }
            ]
        }
    },
    "EDIT_PROJECT_ADDON": {
        "heading": "Edit Project",
        "form_fields": [
            {
                "name": "cover_image",
                "label": "Project Cover Image",
                "type": "file",
                "validation": {
                    "accept": ".jpg,.jpeg,.png,.gif",
                }
            },
            {
                "name": "keywords",
                "label": "Keywords",
                "description": "Enter three to five keywords, separate multiple with commas.",
                "type": "text",
            },
            {
                "name": "related_publications",
                "label": "Related Publications",
                "description": "Publications that cite the published dataset.",
                "type": "array",
                "title_field": "publication_title",
                "fields": [
                    {
                        "name": "publication_type",
                        "label": "Type",
                        "type": "select",
                        "options": [
                            {
                            "label": "", 
                            "value": ""
                            },
                            {
                            "label": "Context",
                            "value": "context"
                            },
                            {
                            "label": "Linked Dataset",
                            "value": "linked_dataset"
                            },
                            {
                            "label": "Cited By",
                            "value": "cited_by"
                            }
                        ],
                        "validation": {
                            "required": True
                        },
                    },
                    {
                        "name": "publication_title",
                        "label": "Publication Title",
                        "type": "text",
                        "validation": {
                            "required": True
                        }
                    },
                    # {
                    #     "name": "publication_author",
                    #     "label": "Publication Author",
                    #     "type": "text",
                    #     "validation": {
                    #         "required": True
                    #     }
                    # },
                    # {
                    #     "name": "publication_date_of_publication",
                    #     "label": "Date of Publication",
                    #     "type": "text",
                    #     "validation": {
                    #         "required": True
                    #     }
                    # },
                    # {
                    #     "name": "publication_publisher",
                    #     "label": "Publisher",
                    #     "type": "text",
                    #     "validation": {
                    #         "required": True
                    #     }
                    # },
                    {
                        "name": "publication_link",
                        "label": "URL or DOI, in URL format",
                        "type": "link",
                        "validation": {
                            "required": True
                        },
                    },
                ]
            },
            {
                "name": "related_datasets",
                "label": "Related Datasets",
                "description": "A dataset of same or other author that this dataset is derived from, has a part of, or is connected to. This is the link to those related datasets.",
                "type": "array",
                "title_field": "dataset_title",
                "fields": [
                   {
                        "name": "dataset_title",
                        "label": "Dataset Title",
                        "type": "text",
                        "validation": {
                            "required": True
                        }
                    },
                    # {
                    #     "name": "dataset_description",
                    #     "label": "Dataset Description",
                    #     "type": "textarea",
                    #     "validation": {
                    #         "required": True
                    #     }
                    # },
                    {
                        "name": "dataset_link",
                        "label": "URL or DOI, in URL format",
                        "type": "link",
                        "validation": {
                            "required": True
                        }
                    }
                ]
            },
            {
                "name": "related_software",
                "label": "Related Software",
                "description": "The software used to work with the dataset. The software can be a visualization, simulation, analysis, a similar program, or a code workflow.",
                "type": "array",
                "title_field": "software_title",
                "fields": [
                    {
                        "name": "software_title",
                        "label": "Software Title",
                        "type": "text",
                        "validation": {
                            "required": True
                        }
                    },
                    {
                        "name": "software_description",
                        "label": "Software Description",
                        "type": "textarea",
                        "validation": {
                            "required": True,
                            "min": 50,
                            "max": 5000,
                        }
                    },
                    {
                        "name": "software_link",
                        "label": "URL or DOI, in URL format ",
                        "type": "link",
                        "validation": {
                            "required": True
                        }
                    }
                ]
            },
            {
                "name": "license",
                "label": "License",
                "type": "select",
                "options": [
                    {
                        "label": "",
                        "value": ""
                    },
                    {
                        "label": "ODC-BY 1.0",
                        "value": "ODC-BY 1.0"
                    }
                ],
            },
        ],
        "footer": {
            "fields": [
                {
                    "name": "edit_project",
                    "label": "Update Changes",
                    "type": "submit"
                }
            ]
        }
    },
    "ADD_SAMPLE_DATA": {
        "heading": "Add Sample Information",
        "form_fields": SAMPLE_FORM_FIELDS,
        "footer": {
            "fields": [
                {
                    "name": "add_sample_data",
                    "label": "Add Sample",
                    "type": "submit",
                }
            ]
        }
    },
    "EDIT_SAMPLE_DATA": {
        "heading": "Edit Sample Information",
        "form_fields": SAMPLE_FORM_FIELDS,
        "footer": {
            "fields": [
                {
                    "name": "update_sample_data",
                    "label": "Update Sample",
                    "type": "submit"
                }
            ]
        }
    },
    "ADD_ORIGIN_DATASET": {
        "heading": "Add Digital Dataset",
        "description": "Digital datasets should not contain any analysis results. If any kind of analysis is conducted on the dataset and is included in the data, it should be listed under the analysis dataset.",
        "form_fields": ORIGIN_DATASET_FORM_FIELDS,
        "footer": {
            "fields": [
                {
                    "name": "add_origin_dataset",
                    "label": "Add Digital Dataset",
                    "type": "submit"
                }
            ]
        }
    },
    "EDIT_ORIGIN_DATASET": {
        "heading": "Edit Digital Dataset",
        "form_fields": ORIGIN_DATASET_FORM_FIELDS,
        "footer": {
            "fields": [
                {
                    "name": "update_origin_dataset",
                    "label": "Update Digital Dataset",
                    "type": "submit"
                }
            ]
        }
    },
    "ADD_ANALYSIS_DATASET": {
        "heading": "Add Analysis Dataset",
        "form_fields": ANALYSIS_DATASET_FORM_FIELDS,
        "footer": {
            "fields": [
                {
                    "name": "add_analysis_dataset",
                    "label": "Add Analysis Dataset",
                    "type": "submit"
                }
            ]
        }
    },
    "EDIT_ANALYSIS_DATASET": {
        "heading": "Edit Analysis Dataset",
        "form_fields": ANALYSIS_DATASET_FORM_FIELDS,
        "footer": {
            "fields": [
                {
                    "name": "update_analysis_dataset",
                    "label": "Update Analysis Dataset",
                    "type": "submit"
                }
            ]
        }
    },
    "ADD_PUBLICATION": {
        "heading": "Add Publication",
        "form_fields": [
            {
                "name": "title",
                "label": "Title",
                "type": "text",
                "validation": {
                    "required": True
                }
            },
            {
                "name": "author",
                "label": "Author",
                "type": "text",
                "validation": {
                    "required": True
                }
            },
            {
                "name": "publication_year",
                "label": "Publication Year",
                "type": "text",
                "validation": {
                    "required": True
                }
            },
            {
                "name": "publisher",
                "label": "Publisher",
                "type": "text",
                "validation": {
                    "required": True
                }
            },
            {
                "name": "doi",
                "label": "DOI",
                "type": "text",
            },
            {
                "name": "attachment",
                "label": "Attachment",
                "type": "file"
            },
            {
                "name": "external_link",
                "label": "External Link",
                "type": "link",
            },
            {
                "name": "abstract",
                "label": "Abstract",
                "type": "textarea",
            }
        ],
    },
    "UPLOAD_FILE": {
        "heading": "Upload File",
        "form_fields": UPLOAD_FILE_FIELDS,
    },
    "EDIT_FILE": {
        "heading": "Edit File",
        "form_fields": UPLOAD_FILE_FIELDS,
        "footer": {
            "fields": [
                {
                    "name": "edit_file",
                    "label": "Update Metadata",
                    "type": "submit"
                }, 
            ]
        }
    }
}