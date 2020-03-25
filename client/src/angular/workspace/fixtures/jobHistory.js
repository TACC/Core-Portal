const jobHistory = [
    {
        "status": "PENDING",
        "description": "Job processing beginning",
        "createdBy": "jchuah",
        "created": "2019-10-10T19:17:47-05:00"
    },
    {
        "status": "PROCESSING_INPUTS",
        "description": "Identifying input files for staging",
        "createdBy": "jchuah",
        "created": "2019-10-10T19:17:48-05:00"
    },
    {
        "status": "STAGING_INPUTS",
        "description": "Transferring job input data to execution system",
        "createdBy": "jchuah",
        "created": "2019-10-10T19:17:51-05:00"
    },
    {
        "status": "STAGING_INPUTS",
        "progress": {
            "averageRate": 23345,
            "uuid": "4a8699a4-a3c8-41d8-bb44-8a9c2c84d468-009",
            "totalBytes": 183217,
            "source": "agave://utrc.storage.community/examples/vasp",
            "totalBytesTransferred": 183217,
            "totalActiveTransfers": 0,
            "totalFiles": 1
        },
        "description": "Job input copy in progress: agave://utrc.storage.community/examples/vasp to agave://utrc.jchuah.exec.stampede2.nores//scratch/04004/jchuah/utrc-scratch/jchuah/job-032142c3-ac6a-42cb-841e-fbc26a2d951c-007-vasp-5-4-4_2019-10-10t19-17-44/vasp",
        "createdBy": "jchuah",
        "created": "2019-10-10T19:17:53-05:00"
    },
    {
        "status": "STAGED",
        "description": "Job inputs staged to execution system",
        "createdBy": "jchuah",
        "created": "2019-10-10T19:17:55-05:00"
    },
    {
        "status": "STAGING_JOB",
        "description": "Staging runtime assets to execution system",
        "createdBy": "jchuah",
        "created": "2019-10-10T19:17:55-05:00"
    },
    {
        "status": "STAGING_JOB",
        "progress": {
            "averageRate": 2856700,
            "uuid": "c029320c-b6a7-4d0e-964d-35d16fa81a2f-009",
            "totalBytes": 184312,
            "source": "agave://utrc.storage.default/applications/vasp/vasp-5.4.4",
            "totalBytesTransferred": 171402,
            "totalActiveTransfers": 0,
            "totalFiles": 1
        },
        "description": "Fetching application assets from agave://utrc.storage.default/applications/vasp/vasp-5.4.4",
        "createdBy": "jchuah",
        "created": "2019-10-10T19:17:57-05:00"
    },
    {
        "status": "STAGING_JOB",
        "progress": {
            "averageRate": 0,
            "uuid": "69faf3df-07ce-4bcb-a12b-eb62967a843c-009",
            "totalBytes": 3359,
            "source": "https://workers.prod.tacc.cloud//tmp/job-032142c3-ac6a-42cb-841e-fbc26a2d951c-007-vasp-5-4-4_2019-10-10t19-17-44",
            "totalBytesTransferred": 3359,
            "totalActiveTransfers": 2,
            "totalFiles": 5
        },
        "description": "Staging runtime assets to agave://utrc.jchuah.exec.stampede2.nores//scratch/04004/jchuah/utrc-scratch/jchuah/job-032142c3-ac6a-42cb-841e-fbc26a2d951c-007-vasp-5-4-4_2019-10-10t19-17-44",
        "createdBy": "jchuah",
        "created": "2019-10-10T19:17:59-05:00"
    },
    {
        "status": "SUBMITTING",
        "description": "Submitting job to execution system",
        "createdBy": "jchuah",
        "created": "2019-10-10T19:17:59-05:00"
    },
    {
        "status": "QUEUED",
        "description": "Job queued to execution system queue",
        "createdBy": "jchuah",
        "created": "2019-10-10T19:18:04-05:00"
    },
    {
        "status": "RUNNING",
        "description": "Job running on execution system",
        "createdBy": "jchuah",
        "created": "2019-10-10T19:22:16-05:00"
    },
    {
        "status": "CLEANING_UP",
        "description": "Job completed execution",
        "createdBy": "jchuah",
        "created": "2019-10-10T19:25:23-05:00"
    },
    {
        "status": "ARCHIVING",
        "description": "Transferring job output to archive system",
        "createdBy": "jchuah",
        "created": "2019-10-10T19:25:23-05:00"
    },
    {
        "status": "ARCHIVING",
        "progress": {
            "averageRate": 525591,
            "uuid": "369c7136-cc21-4c4b-82b1-d83b1e0809c2-009",
            "totalBytes": 403947221,
            "source": "agave://utrc.jchuah.exec.stampede2.nores//scratch/04004/jchuah/utrc-scratch/jchuah/job-032142c3-ac6a-42cb-841e-fbc26a2d951c-007-vasp-5-4-4_2019-10-10t19-17-44",
            "totalBytesTransferred": 403947221,
            "totalActiveTransfers": 0,
            "totalFiles": 1
        },
        "description": "Job archiving in progress: agave://utrc.jchuah.exec.stampede2.nores//scratch/04004/jchuah/utrc-scratch/jchuah/job-032142c3-ac6a-42cb-841e-fbc26a2d951c-007-vasp-5-4-4_2019-10-10t19-17-44 to agave://cep.home.jchuah/archive/jobs/2019-10-10/vasp-5-4-4_2019-10-10t19-17-44-032142c3-ac6a-42cb-841e-fbc26a2d951c-007",
        "createdBy": "jchuah",
        "created": "2019-10-10T19:25:27-05:00"
    },
    {
        "status": "FINISHED",
        "description": "Job completed successfully",
        "createdBy": "jchuah",
        "created": "2019-10-10T19:26:04-05:00"
    }
];

export { jobHistory };