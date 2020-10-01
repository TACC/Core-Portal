export const notificationsListEmptyFixture = {
  notifs: [],
  page: 0,
  total: 0,
  unread: 0
};

export const notificationsListFixture = {
  notifs: [
    {
      event_type: 'job',
      datetime: '1600605194',
      status: 'ERROR',
      operation: 'job_failed',
      message:
        "Job 'RStudio-Stampede2-1.1.423u3_2020-09-20T12:25:10-dcvserver' Failed. Please try again...",
      extra: {
        id: 'ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
        name: 'RStudio-Stampede2-1.1.423u3_2020-09-20T12:25:10-dcvserver',
        tenantId: 'portals',
        tenantQueue: 'aloe.jobq.portals.submit.DefaultQueue',
        status: 'FAILED',
        error_message: 'Job failed',
        accepted: '2020-09-20T12:25:28.463Z',
        created: '2020-09-20T12:25:28.522Z',
        endTime: '2020-09-20T12:33:13.345Z',
        lastUpdated: '2020-09-20T12:33:13.345Z',
        uuid: 'ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
        owner: 'username',
        executionSystem: 'username.TACC-ACI.exec.stampede2.HPC',
        appId: 'prtl.clone.username.TACC-ACI.RStudio-Stampede2-1.1.423u3-3.0',
        workPath:
          '/scratch/05724/username/username/job-ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007-rstudio-stampede2-1-1-423u3_2020-09-20t12-25-10-dcvserver',
        archive: true,
        archiveOnAppError: true,
        archivePath:
          'archive/jobs/2020-09-20/rstudio-stampede2-1-1-423u3_2020-09-20t12-25-10-dcvserver-ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
        archiveSystem: 'frontera.home.username',
        nodeCount: 1,
        processorsPerNode: 20,
        memoryPerNode: 1.0,
        maxRunTime: '00:06:00',
        localId: '6477330',
        batchQueue: 'normal',
        submitTime: '2020-09-20T12:25:46.170Z',
        startTime: '2020-09-20T12:25:50.950Z',
        remoteEnded: '2020-09-20T12:33:06.801Z',
        remoteOutcome: 'FAILED',
        submitRetries: 0,
        remoteStatusChecks: 4,
        failedStatusChecks: 0,
        lastStatusCheck: '2020-09-20T12:33:06.792Z',
        blockedCount: 0,
        visible: true,
        target_path:
          '/workbench/data/agave/frontera.home.username/archive/jobs/2020-09-20/rstudio-stampede2-1-1-423u3_2020-09-20t12-25-10-dcvserver-ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007'
      },
      pk: 37,
      action_link:
        '/workbench/data/agave/frontera.home.username/archive/jobs/2020-09-20/rstudio-stampede2-1-1-423u3_2020-09-20t12-25-10-dcvserver-ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
      user: 'username',
      read: false,
      deleted: false
    },
    {
      event_type: 'job',
      datetime: '1600605187',
      status: 'INFO',
      operation: 'job_status_update',
      message:
        "Job 'RStudio-Stampede2-1.1.423u3_2020-09-20T12:25:10-dcvserver' updated to CLEANING_UP.",
      extra: {
        id: 'ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
        name: 'RStudio-Stampede2-1.1.423u3_2020-09-20T12:25:10-dcvserver',
        tenantId: 'portals',
        tenantQueue: 'aloe.jobq.portals.submit.DefaultQueue',
        status: 'CLEANING_UP',
        error_message: 'Job completed execution',
        accepted: '2020-09-20T12:25:28.463Z',
        created: '2020-09-20T12:25:28.522Z',
        endTime: null,
        lastUpdated: '2020-09-20T12:33:06.807Z',
        uuid: 'ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
        owner: 'username',
        executionSystem: 'username.TACC-ACI.exec.stampede2.HPC',
        appId: 'prtl.clone.username.TACC-ACI.RStudio-Stampede2-1.1.423u3-3.0',
        workPath:
          '/scratch/05724/username/username/job-ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007-rstudio-stampede2-1-1-423u3_2020-09-20t12-25-10-dcvserver',
        archive: true,
        archiveOnAppError: true,
        archivePath:
          'archive/jobs/2020-09-20/rstudio-stampede2-1-1-423u3_2020-09-20t12-25-10-dcvserver-ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
        archiveSystem: 'frontera.home.username',
        nodeCount: 1,
        processorsPerNode: 20,
        memoryPerNode: 1.0,
        maxRunTime: '00:06:00',
        localId: '6477330',
        batchQueue: 'normal',
        submitTime: '2020-09-20T12:25:46.170Z',
        startTime: '2020-09-20T12:25:50.950Z',
        remoteEnded: '2020-09-20T12:33:06.801Z',
        remoteOutcome: 'FAILED',
        submitRetries: 0,
        remoteStatusChecks: 4,
        failedStatusChecks: 0,
        lastStatusCheck: '2020-09-20T12:33:06.792Z',
        blockedCount: 0,
        visible: true
      },
      pk: 36,
      action_link: '',
      user: 'username',
      read: false,
      deleted: false
    },
    {
      event_type: 'interactive_session_ready',
      datetime: '1600604773',
      status: 'INFO',
      operation: 'web_link',
      message: 'Ready to view.',
      extra: {
        id: 'ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
        name: 'RStudio-Stampede2-1.1.423u3_2020-09-20T12:25:10-dcvserver',
        tenantId: 'portals',
        tenantQueue: 'aloe.jobq.portals.submit.DefaultQueue',
        status: 'RUNNING',
        lastStatusMessage:
          'Transitioning from status QUEUED to RUNNING in phase MONITORING.',
        accepted: '2020-09-20T12:25:28.463Z',
        created: '2020-09-20T12:25:28.000Z',
        ended: null,
        lastUpdated: '2020-09-20T12:25:50.000Z',
        owner: 'username',
        roles:
          'Internal/PORTALS_username_cep-dev_PRODUCTION,Internal/PORTALS_username_test_PRODUCTION,Internal/PORTALS_username_cep dev_PRODUCTION,Internal/PORTALS_username_test-nathaf_PRODUCTION,Internal/PORTALS_username_DefaultApplication_PRODUCTION,Internal/PORTALS_username_cep-dev_SANDBOX,Internal/everyone,Internal/PORTALS_username_cep dev_SANDBOX',
        systemId: 'username.TACC-ACI.exec.stampede2.HPC',
        appId: 'prtl.clone.username.TACC-ACI.RStudio-Stampede2-1.1.423u3-3.0',
        appUuid: '6262962608719195670-242ac116-0001-005',
        workPath:
          '/scratch/05724/username/username/job-ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007-rstudio-stampede2-1-1-423u3_2020-09-20t12-25-10-dcvserver',
        archive: true,
        archivePath:
          'archive/jobs/2020-09-20/rstudio-stampede2-1-1-423u3_2020-09-20t12-25-10-dcvserver-ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
        archiveSystem: 'frontera.home.username',
        nodeCount: 1,
        processorsPerNode: 20,
        memoryPerNode: 1.0,
        maxHours: 0.1,
        inputs: {
          workingDirectory: 'agave://frontera.home.username/5MB.txt'
        },
        parameters: {
          desktop_resolution: '1280x800',
          _webhook_base_url: 'http://320a61b9b96e.ngrok.io/webhooks/'
        },
        remoteJobId: '6477330',
        schedulerJobId: null,
        remoteQueue: 'normal',
        remoteSubmitted: '2020-09-20T12:25:46.170Z',
        remoteStarted: '2020-09-20T12:25:50.950Z',
        remoteEnded: null,
        remoteOutcome: null,
        submitRetries: 0,
        remoteStatusChecks: 1,
        failedStatusChecks: 0,
        lastStatusCheck: '2020-09-20T12:25:50.945Z',
        blockedCount: 0,
        visible: true,
        _links: {
          self: {
            href:
              'https://portals-api.tacc.utexas.edu/jobs/v2/ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007'
          },
          app: {
            href:
              'https://portals-api.tacc.utexas.edu/apps/v2/prtl.clone.username.TACC-ACI.RStudio-Stampede2-1.1.423u3-3.0'
          },
          executionSystem: {
            href:
              'https://portals-api.tacc.utexas.edu/systems/v2/username.TACC-ACI.exec.stampede2.HPC'
          },
          archiveSystem: {
            href:
              'https://portals-api.tacc.utexas.edu/systems/v2/frontera.home.username'
          },
          archiveData: {
            href:
              'https://portals-api.tacc.utexas.edu/jobs/v2/ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007/outputs/listings'
          },
          owner: {
            href: 'https://portals-api.tacc.utexas.edu/profiles/v2/username'
          },
          permissions: {
            href:
              'https://portals-api.tacc.utexas.edu/jobs/v2/ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007/pems'
          },
          history: {
            href:
              'https://portals-api.tacc.utexas.edu/jobs/v2/ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007/history'
          },
          metadata: {
            href:
              'https://portals-api.tacc.utexas.edu/meta/v2/data/?q=%7B%22associationIds%22%3A%22ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007%22%7D'
          },
          notifications: {
            href:
              'https://portals-api.tacc.utexas.edu/notifications/v2/?associatedUuid=ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007'
          }
        }
      },
      pk: 35,
      action_link: 'https://stampede2.tacc.utexas.edu:10401',
      user: 'username',
      read: false,
      deleted: false
    },
    {
      event_type: 'job',
      datetime: '1600604751',
      status: 'INFO',
      operation: 'job_status_update',
      message:
        "Job 'RStudio-Stampede2-1.1.423u3_2020-09-20T12:25:10-dcvserver' updated to RUNNING.",
      extra: {
        id: 'ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
        name: 'RStudio-Stampede2-1.1.423u3_2020-09-20T12:25:10-dcvserver',
        tenantId: 'portals',
        tenantQueue: 'aloe.jobq.portals.submit.DefaultQueue',
        status: 'RUNNING',
        error_message: 'Job running on execution system',
        accepted: '2020-09-20T12:25:28.463Z',
        created: '2020-09-20T12:25:28.522Z',
        endTime: null,
        lastUpdated: '2020-09-20T12:25:50.950Z',
        uuid: 'ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
        owner: 'username',
        executionSystem: 'username.TACC-ACI.exec.stampede2.HPC',
        appId: 'prtl.clone.username.TACC-ACI.RStudio-Stampede2-1.1.423u3-3.0',
        workPath:
          '/scratch/05724/username/username/job-ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007-rstudio-stampede2-1-1-423u3_2020-09-20t12-25-10-dcvserver',
        archive: true,
        archiveOnAppError: true,
        archivePath:
          'archive/jobs/2020-09-20/rstudio-stampede2-1-1-423u3_2020-09-20t12-25-10-dcvserver-ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
        archiveSystem: 'frontera.home.username',
        nodeCount: 1,
        processorsPerNode: 20,
        memoryPerNode: 1.0,
        maxRunTime: '00:06:00',
        localId: '6477330',
        batchQueue: 'normal',
        submitTime: '2020-09-20T12:25:46.170Z',
        startTime: '2020-09-20T12:25:50.950Z',
        remoteEnded: null,
        remoteOutcome: null,
        submitRetries: 0,
        remoteStatusChecks: 1,
        failedStatusChecks: 0,
        lastStatusCheck: '2020-09-20T12:25:50.945Z',
        blockedCount: 0,
        visible: true
      },
      pk: 34,
      action_link: '',
      user: 'username',
      read: false,
      deleted: false
    },
    {
      event_type: 'job',
      datetime: '1600604746',
      status: 'INFO',
      operation: 'job_status_update',
      message:
        "Job 'RStudio-Stampede2-1.1.423u3_2020-09-20T12:25:10-dcvserver' updated to QUEUED.",
      extra: {
        id: 'ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
        name: 'RStudio-Stampede2-1.1.423u3_2020-09-20T12:25:10-dcvserver',
        tenantId: 'portals',
        tenantQueue: 'aloe.jobq.portals.submit.DefaultQueue',
        status: 'QUEUED',
        error_message: 'Job queued to execution system queue',
        accepted: '2020-09-20T12:25:28.463Z',
        created: '2020-09-20T12:25:28.522Z',
        endTime: null,
        lastUpdated: '2020-09-20T12:25:46.170Z',
        uuid: 'ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
        owner: 'username',
        executionSystem: 'username.TACC-ACI.exec.stampede2.HPC',
        appId: 'prtl.clone.username.TACC-ACI.RStudio-Stampede2-1.1.423u3-3.0',
        workPath:
          '/scratch/05724/username/username/job-ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007-rstudio-stampede2-1-1-423u3_2020-09-20t12-25-10-dcvserver',
        archive: true,
        archiveOnAppError: true,
        archivePath:
          'archive/jobs/2020-09-20/rstudio-stampede2-1-1-423u3_2020-09-20t12-25-10-dcvserver-ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
        archiveSystem: 'frontera.home.username',
        nodeCount: 1,
        processorsPerNode: 20,
        memoryPerNode: 1.0,
        maxRunTime: '00:06:00',
        localId: '6477330',
        batchQueue: 'normal',
        submitTime: '2020-09-20T12:25:46.170Z',
        startTime: null,
        remoteEnded: null,
        remoteOutcome: null,
        submitRetries: 0,
        remoteStatusChecks: 0,
        failedStatusChecks: 0,
        lastStatusCheck: null,
        blockedCount: 0,
        visible: true
      },
      pk: 33,
      action_link: '',
      user: 'username',
      read: false,
      deleted: false
    },
    {
      event_type: 'job',
      datetime: '1600604740',
      status: 'INFO',
      operation: 'job_status_update',
      message:
        "Job 'RStudio-Stampede2-1.1.423u3_2020-09-20T12:25:10-dcvserver' updated to SUBMITTING.",
      extra: {
        id: 'ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
        name: 'RStudio-Stampede2-1.1.423u3_2020-09-20T12:25:10-dcvserver',
        tenantId: 'portals',
        tenantQueue: 'aloe.jobq.portals.submit.DefaultQueue',
        status: 'SUBMITTING',
        error_message: 'Submitting job to execution system',
        accepted: '2020-09-20T12:25:28.463Z',
        created: '2020-09-20T12:25:28.522Z',
        endTime: null,
        lastUpdated: '2020-09-20T12:25:40.042Z',
        uuid: 'ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
        owner: 'username',
        executionSystem: 'username.TACC-ACI.exec.stampede2.HPC',
        appId: 'prtl.clone.username.TACC-ACI.RStudio-Stampede2-1.1.423u3-3.0',
        workPath:
          '/scratch/05724/username/username/job-ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007-rstudio-stampede2-1-1-423u3_2020-09-20t12-25-10-dcvserver',
        archive: true,
        archiveOnAppError: true,
        archivePath:
          'archive/jobs/2020-09-20/rstudio-stampede2-1-1-423u3_2020-09-20t12-25-10-dcvserver-ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
        archiveSystem: 'frontera.home.username',
        nodeCount: 1,
        processorsPerNode: 20,
        memoryPerNode: 1.0,
        maxRunTime: '00:06:00',
        localId: null,
        batchQueue: 'normal',
        submitTime: null,
        startTime: null,
        remoteEnded: null,
        remoteOutcome: null,
        submitRetries: 0,
        remoteStatusChecks: 0,
        failedStatusChecks: 0,
        lastStatusCheck: null,
        blockedCount: 0,
        visible: true
      },
      pk: 32,
      action_link: '',
      user: 'username',
      read: false,
      deleted: false
    },
    {
      event_type: 'job',
      datetime: '1600604732',
      status: 'INFO',
      operation: 'job_status_update',
      message:
        "Job 'RStudio-Stampede2-1.1.423u3_2020-09-20T12:25:10-dcvserver' updated to STAGING_INPUTS.",
      extra: {
        id: 'ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
        name: 'RStudio-Stampede2-1.1.423u3_2020-09-20T12:25:10-dcvserver',
        tenantId: 'portals',
        tenantQueue: 'aloe.jobq.portals.submit.DefaultQueue',
        status: 'STAGING_INPUTS',
        error_message: 'Transferring job input data to execution system',
        accepted: '2020-09-20T12:25:28.463Z',
        created: '2020-09-20T12:25:28.522Z',
        endTime: null,
        lastUpdated: '2020-09-20T12:25:31.652Z',
        uuid: 'ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
        owner: 'username',
        executionSystem: 'username.TACC-ACI.exec.stampede2.HPC',
        appId: 'prtl.clone.username.TACC-ACI.RStudio-Stampede2-1.1.423u3-3.0',
        workPath: null,
        archive: true,
        archiveOnAppError: true,
        archivePath:
          'archive/jobs/2020-09-20/rstudio-stampede2-1-1-423u3_2020-09-20t12-25-10-dcvserver-ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
        archiveSystem: 'frontera.home.username',
        nodeCount: 1,
        processorsPerNode: 20,
        memoryPerNode: 1.0,
        maxRunTime: '00:06:00',
        localId: null,
        batchQueue: 'normal',
        submitTime: null,
        startTime: null,
        remoteEnded: null,
        remoteOutcome: null,
        submitRetries: 0,
        remoteStatusChecks: 0,
        failedStatusChecks: 0,
        lastStatusCheck: null,
        blockedCount: 0,
        visible: true
      },
      pk: 31,
      action_link: '',
      user: 'username',
      read: false,
      deleted: false
    },
    {
      event_type: 'job',
      datetime: '1600604729',
      status: 'INFO',
      operation: 'job_status_update',
      message:
        "Job 'RStudio-Stampede2-1.1.423u3_2020-09-20T12:25:10-dcvserver' updated to PENDING.",
      extra: {
        id: 'ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
        name: 'RStudio-Stampede2-1.1.423u3_2020-09-20T12:25:10-dcvserver',
        tenantId: 'portals',
        tenantQueue: 'aloe.jobq.portals.submit.DefaultQueue',
        status: 'PENDING',
        error_message: 'Job processing beginning',
        accepted: '2020-09-20T12:25:28.463Z',
        created: '2020-09-20T12:25:28.522Z',
        endTime: null,
        lastUpdated: '2020-09-20T12:25:28.522Z',
        uuid: 'ca48197a-4e9c-4ffc-868c-29a3113cd5e7-007',
        owner: 'username',
        executionSystem: null,
        appId: 'prtl.clone.username.TACC-ACI.RStudio-Stampede2-1.1.423u3-3.0',
        workPath: null,
        archive: true,
        archiveOnAppError: true,
        // eslint-disable-next-line no-template-curly-in-string
        archivePath: 'archive/jobs/2020-09-20/${JOB_NAME}-${JOB_ID}',
        archiveSystem: 'frontera.home.username',
        nodeCount: 1,
        processorsPerNode: 20,
        memoryPerNode: 0.0,
        maxRunTime: '00:06:00',
        localId: null,
        batchQueue: 'normal',
        submitTime: null,
        startTime: null,
        remoteEnded: null,
        remoteOutcome: null,
        submitRetries: 0,
        remoteStatusChecks: 0,
        failedStatusChecks: 0,
        lastStatusCheck: null,
        blockedCount: 0,
        visible: true
      },
      pk: 30,
      action_link: '',
      user: 'maxmustermann',
      read: false,
      deleted: false
    }
  ],
  page: 0,
  total: 8,
  unread: 8
};
