const list_response = {
    "response": {
        "execution": [
            {
                "status": "UP",
                "maxSystemJobs": 999,
                "site": null,
                "owner": null,
                "maxSystemJobsPerUser": 10,
                "id": "username.allocation.exec.ls5.HPC",
                "workDir": null,
                "uuid": null,
                "storage": {
                    "protocol": null,
                    "homeDir": null,
                    "rootDir": null,
                    "auth": {
                    "username": null,
                    "publicKey": null,
                    "password": null,
                    "type": null,
                    "privateKey": null
                    },
                    "host": null,
                    "publicAppsDir": null,
                    "mirror": false,
                    "port": null,
                    "proxy": null
                },
                "environment": null,
                "type": "EXECUTION",
                "public": false,
                "revision": null,
                "available": true,
                "description": "Exec system for user: username",
                "scratchDir": null,
                "scheduler": "SLURM",
                "startupScript": null,
                "name": "Lonestar5 SLURM Execution Host",
                "default": false,
                "globalDefault": false,
                "queues": [],
                "executionType": "HPC",
                "lastModified": "2019-06-05T15:38:15.000-05:00",
                "login": {
                    "host": null,
                    "protocol": null,
                    "proxy": null,
                    "auth": {
                    "username": null,
                    "publicKey": null,
                    "password": null,
                    "type": null,
                    "privateKey": null
                    },
                    "port": null
                }
            }
        ],
        "storage": [
            {
                "available": true,
                "status": "UP",
                "description": "test project system",
                "name": "test",
                "default": false,
                "globalDefault": false,
                "id": "cep.project.test",
                "storage": {
                    "protocol": null,
                    "homeDir": null,
                    "rootDir": null,
                    "auth": {
                        "username": null,
                        "publicKey": null,
                        "password": null,
                        "type": null,
                        "privateKey": null
                    },
                    "host": null,
                    "publicAppsDir": null,
                    "mirror": false,
                    "port": null,
                    "proxy": null
                },
                "uuid": null,
                "absolutePath": null,
                "site": null,
                "owner": null,
                "type": "STORAGE",
                "public": false,
                "revision": null
            }
        ]
    }
};

export {list_response};