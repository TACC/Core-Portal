const jobDetailSlurmFixture = {
  id: 'b5c4014b-31e7-47a0-954f-c9d404320904-007',
  name: 'qgis-3.48_2020-08-06T17:21:32-dcvserver',
  tenantId: 'portals',
  tenantQueue: 'aloe.jobq.portals.submit.DefaultQueue',
  status: 'FAILED',
  lastStatusMessage:
    'APPS_USER_APP_FAILURE Failure indicated by Slurm status TIMEOUT with user application return code: 0:0',
  accepted: '2020-08-06T17:23:08.139Z',
  created: '2020-08-06T17:23:08.000Z',
  ended: '2020-08-06T21:25:52.177Z',
  lastUpdated: '2020-08-06T21:25:52.000Z',
  owner: 'maxmunsterman',
  roles:
    'Internal/PORTALS_maxmunstermann_cep-dev_PRODUCTION,Internal/PORTALS_maxmunstermann_test_PRODUCTION,Internal/PORTALS_maxmunstermann_cep dev_PRODUCTION,Internal/PORTALS_maxmunstermann_test-nathaf_PRODUCTION,Internal/PORTALS_maxmunstermann_DefaultApplication_PRODUCTION,Internal/PORTALS_maxmunstermann_cep-dev_SANDBOX,Internal/everyone,Internal/PORTALS_maxmunstermann_cep dev_SANDBOX',
  systemId: 'maxmunstermann.TACC-ACI.exec.stampede2.HPC',
  appId: 'prtl.clone.maxmunstermann.TACC-ACI.qgis-3.48-5.0',
  appUuid: '713780412274774506-242ac115-0001-005',
  workPath:
    '/scratch/05724/maxmunstermann/maxmunstermann/job-b5c4014b-31e7-47a0-954f-c9d404320904-007-qgis-3-48_2020-08-06t17-21-32-dcvserver',
  archive: true,
  archivePath:
    'archive/jobs/2020-08-06/qgis-3-48_2020-08-06t17-21-32-dcvserver-b5c4014b-31e7-47a0-954f-c9d404320904-007',
  archiveSystem: 'frontera.home.maxmunstermann',
  nodeCount: 1,
  processorsPerNode: 20,
  memoryPerNode: 1.0,
  maxHours: 4.0,
  inputs: { workingDirectory: 'agave://frontera.home.maxmunstermann/5MB.txt' },
  parameters: {
    desktop_resolution: '1280x800',
    _webhook_base_url: 'http://fcf24ba44251.ngrok.io/webhooks/'
  },
  remoteJobId: '6198008',
  schedulerJobId: null,
  remoteQueue: 'normal',
  remoteSubmitted: '2020-08-06T17:23:31.811Z',
  remoteStarted: '2020-08-06T17:23:36.596Z',
  remoteEnded: '2020-08-06T21:25:44.728Z',
  remoteOutcome: 'FAILED',
  submitRetries: 0,
  remoteStatusChecks: 79,
  failedStatusChecks: 0,
  lastStatusCheck: '2020-08-06T21:25:44.722Z',
  blockedCount: 1,
  visible: true,
  _links: {
    self: {
      href:
        'https://portals-api.tacc.utexas.edu/jobs/v2/b5c4014b-31e7-47a0-954f-c9d404320904-007'
    },
    app: {
      href:
        'https://portals-api.tacc.utexas.edu/apps/v2/prtl.clone.maxmunstermann.TACC-ACI.qgis-3.48-5.0'
    },
    executionSystem: {
      href:
        'https://portals-api.tacc.utexas.edu/systems/v2/maxmunstermann.TACC-ACI.exec.stampede2.HPC'
    },
    archiveSystem: {
      href:
        'https://portals-api.tacc.utexas.edu/systems/v2/frontera.home.maxmunstermann'
    },
    archiveData: {
      href:
        'https://portals-api.tacc.utexas.edu/files/v2/listings/system/frontera.home.maxmunstermann/archive/jobs/2020-08-06/qgis-3-48_2020-08-06t17-21-32-dcvserver-b5c4014b-31e7-47a0-954f-c9d404320904-007'
    },
    owner: {
      href: 'https://portals-api.tacc.utexas.edu/profiles/v2/maxmunstermann'
    },
    permissions: {
      href:
        'https://portals-api.tacc.utexas.edu/jobs/v2/b5c4014b-31e7-47a0-954f-c9d404320904-007/pems'
    },
    history: {
      href:
        'https://portals-api.tacc.utexas.edu/jobs/v2/b5c4014b-31e7-47a0-954f-c9d404320904-007/history'
    },
    metadata: {
      href:
        'https://portals-api.tacc.utexas.edu/meta/v2/data/?q=%7B%22associationIds%22%3A%22b5c4014b-31e7-47a0-954f-c9d404320904-007%22%7D'
    },
    notifications: {
      href:
        'https://portals-api.tacc.utexas.edu/notifications/v2/?associatedUuid=b5c4014b-31e7-47a0-954f-c9d404320904-007'
    }
  },
  _embedded: { metadata: [] },
  archiveUrl:
    '/workbench/data-depot/agave/frontera.home.maxmunstermann/archive/jobs/2020-08-06/qgis-3-48_2020-08-06t17-21-32-dcvserver-b5c4014b-31e7-47a0-954f-c9d404320904-007/',
  jupyterUrl:
    'https://jupyter.tacc.cloud/user/maxmunstermann/tree/tacc-work/archive/jobs/2020-08-06/qgis-3-48_2020-08-06t17-21-32-dcvserver-b5c4014b-31e7-47a0-954f-c9d404320904-007'
};

export default jobDetailSlurmFixture;
