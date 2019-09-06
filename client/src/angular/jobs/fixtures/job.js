const job = {
    "remoteStarted": "2019-07-16T15:08:41.686-05:00",
    "memoryPerNode": 85,
    "archiveSystem": "utrc-home.username",
    "processorsPerNode": 24,
    "appId": "prtl.clone.username.A-ccsc.kallisto-0.45.0u3-3.0",
    "archiveUrl": "/workbench/data-depot/agave/utrc-home.username/archive/jobs/2019-07-16/kallisto-0-45-0u3_2019-07-16t15-07-18-47395f11-ddc9-44d6-b310-d6fe68b463d9-007/",
    "visible": true,
    "tenantQueue": "aloe.jobq.portals.submit.DefaultQueue",
    "owner": "username",
    "lastStatusCheck": "2019-07-16T15:09:45.148-05:00",
    "id": "47395f11-ddc9-44d6-b310-d6fe68b463d9-007",
    "blockedCount": 0,
    "lastStatusMessage": "Transitioning from status ARCHIVING to FINISHED in phase ARCHIVING.",
    "_embedded": {
        "metadata": []
    },
    "parameters": {
        "output": "output",
        "seed": 42
    },
    "archivePath": "archive/jobs/2019-07-16/kallisto-0-45-0u3_2019-07-16t15-07-18-47395f11-ddc9-44d6-b310-d6fe68b463d9-007",
    "archive": true,
    "_links": {
        "notifications": {
            "href": "https://portals-api.tacc.utexas.edu/notifications/v2/?associatedUuid=47395f11-ddc9-44d6-b310-d6fe68b463d9-007"
        },
        "archiveSystem": {
            "href": "https://portals-api.tacc.utexas.edu/systems/v2/utrc-home.username"
        },
        "self": {
            "href": "https://portals-api.tacc.utexas.edu/jobs/v2/47395f11-ddc9-44d6-b310-d6fe68b463d9-007"
        },
        "metadata": {
            "href": "https://portals-api.tacc.utexas.edu/meta/v2/data/?q=%7B%22associationIds%22%3A%2247395f11-ddc9-44d6-b310-d6fe68b463d9-007%22%7D"
        },
        "archiveData": {
            "href": "https://portals-api.tacc.utexas.edu/files/v2/listings/system/utrc-home.username/archive/jobs/2019-07-16/kallisto-0-45-0u3_2019-07-16t15-07-18-47395f11-ddc9-44d6-b310-d6fe68b463d9-007"
        },
        "executionSystem": {
            "href": "https://portals-api.tacc.utexas.edu/systems/v2/username.A-ccsc.exec.ls5.HPC"
        },
        "owner": {
            "href": "https://portals-api.tacc.utexas.edu/profiles/v2/username"
        },
        "history": {
            "href": "https://portals-api.tacc.utexas.edu/jobs/v2/47395f11-ddc9-44d6-b310-d6fe68b463d9-007/history"
        },
        "app": {
            "href": "https://portals-api.tacc.utexas.edu/apps/v2/prtl.clone.username.A-ccsc.kallisto-0.45.0u3-3.0"
        },
        "permissions": {
            "href": "https://portals-api.tacc.utexas.edu/jobs/v2/47395f11-ddc9-44d6-b310-d6fe68b463d9-007/pems"
        }
    },
    "remoteStatusChecks": 3,
    "schedulerJobId": null,
    "status": "FINISHED",
    "inputs": {
        "fastq2": "agave://utrc.storage.community/examples/kallisto/reads_2.fastq.gz",
        "fasta": "agave://utrc.storage.community/examples/kallisto/transcripts.fasta.gz",
        "fastq1": "agave://utrc.storage.community/examples/kallisto/reads_1.fastq.gz"
    },
    "remoteOutcome": "FINISHED",
    "remoteEnded": "2019-07-16T15:09:45.159-05:00",
    "lastUpdated": "2019-07-16T15:09:55.000-05:00",
    "remoteJobId": "2292925",
    "failedStatusChecks": 0,
    "maxHours": 1,
    "nodeCount": 1,
    "accepted": "2019-07-16T15:07:56.368-05:00",
    "remoteSubmitted": "2019-07-16T15:08:27.517-05:00",
    "submitRetries": 0,
    "name": "kallisto-0.45.0u3_2019-07-16T15:07:18",
    "roles": "Internal/PORTALS_username-10-146-162-236.public.utexas.edu_PRODUCTION,Internal/PORTALS_username-10-146-3-184.public.utexas.edu_PRODUCTION,Internal/PORTALS_username-10-146-60-109.public.utexas.edu_PRODUCTION,Internal/everyone,Internal/PORTALS_username-10-146-122-115.public.utexas.edu_PRODUCTION",
    "ended": "2019-07-16T15:09:55.906-05:00",
    "workPath": "/work/04004/username/username/job-47395f11-ddc9-44d6-b310-d6fe68b463d9-007-kallisto-0-45-0u3_2019-07-16t15-07-18",
    "created": "2019-07-16T15:07:56.000-05:00",
    "tenantId": "portals",
    "remoteQueue": "normal",
    "systemId": "username.A-ccsc.exec.ls5.HPC",
    "appUuid": "8372750124565860841-242ac117-0001-005"
}

export { job }