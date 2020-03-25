const jobResponse = {
    "response": {
        "remoteStarted": "2019-08-15T17:40:17.795-05:00",
        "memoryPerNode": 1,
        "archiveSystem": "cep.home.jchuah",
        "processorsPerNode": 1,
        "appId": "prtl.clone.jchuah.FORK.extract-0.1u6-6.0",
        "archiveUrl": "/workbench/data-depot/agave/cep.home.jchuah/",
        "visible": true,
        "tenantQueue": "aloe.jobq.portals.submit.DefaultQueue",
        "owner": "jchuah",
        "lastStatusCheck": "2019-08-15T17:40:22.426-05:00",
        "id": "324e9f3e-824c-492a-a6f7-b566f3ce3da9-007",
        "blockedCount": 0,
        "lastStatusMessage": "Transitioning from status ARCHIVING to FINISHED in phase ARCHIVING.",
        "_embedded": {
            "metadata": []
        },
        "parameters": {},
        "archivePath": "/",
        "archive": true,
        "_links": {
            "notifications": {
                "href": "https://portals-api.tacc.utexas.edu/notifications/v2/?associatedUuid=324e9f3e-824c-492a-a6f7-b566f3ce3da9-007"
            },
            "archiveSystem": {
                "href": "https://portals-api.tacc.utexas.edu/systems/v2/cep.home.jchuah"
            },
            "self": {
                "href": "https://portals-api.tacc.utexas.edu/jobs/v2/324e9f3e-824c-492a-a6f7-b566f3ce3da9-007"
            },
            "metadata": {
                "href": "https://portals-api.tacc.utexas.edu/meta/v2/data/?q=%7B%22associationIds%22%3A%22324e9f3e-824c-492a-a6f7-b566f3ce3da9-007%22%7D"
            },
            "archiveData": {
                "href": "https://portals-api.tacc.utexas.edu/files/v2/listings/system/cep.home.jchuah//"
            },
            "executionSystem": {
                "href": "https://portals-api.tacc.utexas.edu/systems/v2/jchuah.FORK.exec.stampede2.CLI"
            },
            "owner": {
                "href": "https://portals-api.tacc.utexas.edu/profiles/v2/jchuah"
            },
            "history": {
                "href": "https://portals-api.tacc.utexas.edu/jobs/v2/324e9f3e-824c-492a-a6f7-b566f3ce3da9-007/history"
            },
            "app": {
                "href": "https://portals-api.tacc.utexas.edu/apps/v2/prtl.clone.jchuah.FORK.extract-0.1u6-6.0"
            },
            "permissions": {
                "href": "https://portals-api.tacc.utexas.edu/jobs/v2/324e9f3e-824c-492a-a6f7-b566f3ce3da9-007/pems"
            }
        },
        "jupyterUrl": "https://jupyter.tacc.cloud/user/jchuah/tree/tacc-work//",
        "remoteStatusChecks": 1,
        "schedulerJobId": null,
        "status": "FINISHED",
        "inputs": {
            "inputFile": "agave://cep.home.jchuah/notifications.zip"
        },
        "remoteOutcome": "FINISHED",
        "remoteEnded": "2019-08-15T17:40:22.432-05:00",
        "lastUpdated": "2019-08-15T17:40:26.000-05:00",
        "remoteJobId": "45076",
        "failedStatusChecks": 0,
        "maxHours": 2,
        "nodeCount": 1,
        "accepted": "2019-08-15T17:39:59.286-05:00",
        "remoteSubmitted": "2019-08-15T17:40:17.739-05:00",
        "submitRetries": 0,
        "name": "Extracting Zip File",
        "roles": "Internal/PORTALS_jchuah_wireless-10-146-162-236.public.utexas.edu_PRODUCTION,Internal/PORTALS_jchuah_wireless-10-146-3-184.public.utexas.edu_PRODUCTION,Internal/PORTALS_jchuah_wireless-10-146-60-109.public.utexas.edu_PRODUCTION,Internal/everyone,Internal/PORTALS_jchuah_wireless-10-146-122-115.public.utexas.edu_PRODUCTION",
        "ended": "2019-08-15T17:40:26.996-05:00",
        "workPath": "/work/04004/jchuah/jchuah/job-324e9f3e-824c-492a-a6f7-b566f3ce3da9-007-extracting-zip-file",
        "created": "2019-08-15T17:39:59.000-05:00",
        "tenantId": "portals",
        "remoteQueue": "debug",
        "systemId": "jchuah.FORK.exec.stampede2.CLI",
        "appUuid": "5485858577324437015-242ac116-0001-005"
    }
}

export { jobResponse };