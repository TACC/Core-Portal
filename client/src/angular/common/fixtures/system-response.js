const system_response = {
    "response": {
        "available": true,
        "status": "UP",
        "description": "Default storage system for cep",
        "name": "test.storage.system",
        "default": true,
        "globalDefault": true,
        "id": "test.storage.system",
        "storage": {
        "protocol": "SFTP",
        "homeDir": "/",
        "rootDir": "/home/wma_prtl/cep",
        "auth": {
        "username": null,
        "publicKey": null,
        "type": "SSHKEYS",
        "privateKey": null
        },
        "host": "data.tacc.utexas.edu",
        "publicAppsDir": null,
        "mirror": false,
        "port": 22,
        "proxy": null
        },
        "uuid": "000000000000000000-000ac000-000-000",
        "absolutePath": null,
        "site": "portal.dev",
        "owner": "wma_prtl",
        "type": "STORAGE",
        "public": true,
        "revision": 3
    }
};

export {system_response};