const compressApp = {
    "defaultMemoryPerNode": 1,
    "owner": "wma_prtl",
    "defaultQueue": "debug",
    "id": "compress-0.1u3",
    "uuid": "721793442282860055-242ac11a-0001-005",
    "parameters": [
        {
            "semantics": {
                "minCardinality": 1,
                "ontology": [
                    "xs:enumeration",
                    "xs:string"
                ],
                "maxCardinality": 1
            },
            "id": "compression_type",
            "value": {
                "enquote": false,
                "visible": true,
                "default": "tgz",
                "required": true,
                "type": "enumeration",
                "order": 0,
                "enum_values": [
                    {
                        "tgz": "tar.gz"
                    },
                    {
                        "zip": "zip"
                    }
                ]
            },
            "details": {
                "argument": null,
                "repeatArgument": false,
                "description": "Select the type of compressed file, either a Gzipped TAR file (.tar.gz) or a Zip file (.zip).",
                "showArgument": false,
                "label": "Compression Type"
            }
        }
    ],
    "shortDescription": "Compress a folder for download.",
    "defaultNodeCount": 1,
    "label": "Compress folder",
    "defaultProcessorsPerNode": 1,
    "version": "0.1",
    "_links": {
        "self": {
            "href": "https://portals-api.tacc.utexas.edu/apps/v2/compress-0.1u3"
        },
        "storageSystem": {
            "href": "https://portals-api.tacc.utexas.edu/systems/v2/cep.storage.default"
        },
        "executionSystem": {
            "href": "https://portals-api.tacc.utexas.edu/systems/v2/cep.community.exec.stampede2.cli"
        },
        "owner": {
            "href": "https://portals-api.tacc.utexas.edu/profiles/v2/wma_prtl"
        },
        "permissions": {
            "href": "https://portals-api.tacc.utexas.edu/apps/v2/compress-0.1u3/pems"
        },
        "history": {
            "href": "https://portals-api.tacc.utexas.edu/apps/v2/compress-0.1u3/history"
        },
        "metadata": {
            "href": "https://portals-api.tacc.utexas.edu/meta/v2/data/?q=%7B%22associationIds%22%3A%22721793442282860055-242ac11a-0001-005%22%7D"
        }
    },
    "templatePath": "wrapper.sh",
    "defaultMaxRunTime": "02:00:00",
    "revision": 3,
    "available": true,
    "inputs": [
        {
            "semantics": {
                "fileTypes": [
                    "raw-0"
                ],
                "minCardinality": 1,
                "ontology": [
                    "xsd:string"
                ],
                "maxCardinality": 1
            },
            "id": "workingDirectory",
            "value": {
                "enquote": false,
                "visible": true,
                "validator": "",
                "default": "agave://cep.storage.default/",
                "required": true,
                "order": 0
            },
            "details": {
                "argument": null,
                "repeatArgument": false,
                "description": "The directory or file to be compressed.",
                "showArgument": false,
                "label": "Target Path to be Compressed"
            }
        }
    ],
    "tags": [
        "appCategory:Utilities",
        "appIcon:compress"
    ],
    "outputs": [],
    "isPublic": true,
    "longDescription": "Compress a folder for download.",
    "executionSystem": "cep.community.exec.stampede2.cli",
    "scheduler": "FORK",
    "testPath": "test/test.sh",
    "ontology": [],
    "deploymentPath": "/api/2/apps/compress-0.1u3.zip",
    "icon": "",
    "deploymentSystem": "cep.storage.default",
    "resource": "stampede2.tacc.utexas.edu",
    "name": "compress",
    "license": {
        "type": null
    },
    "checkpointable": false,
    "lastModified": "2019-03-05T14:40:50-06:00",
    "modules": [],
    "executionType": "CLI",
    "parallelism": "SERIAL",
    "helpURI": null,
    "allocations": [
        "A-ccsc",
        "SD2E-Community",
        "TACC-ACI"
    ],
    "portal_alloc": ""
}

export { compressApp };