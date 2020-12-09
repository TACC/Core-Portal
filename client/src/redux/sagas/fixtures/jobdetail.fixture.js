const jobDetailFixture = {
  id: 'job_id',
  name: 'compress-0.1u3_2020-07-09T15:56:37',
  tenantId: 'portals',
  tenantQueue: 'aloe.jobq.portals.submit.DefaultQueue',
  status: 'FAILED',
  lastStatusMessage: 'My last job status',
  accepted: '2020-07-09T15:57:43.471Z',
  created: '2020-07-09T15:57:43.000Z',
  ended: '2020-07-09T15:57:52.273Z',
  lastUpdated: '2020-07-09T15:57:52.000Z',
  owner: 'username',
  roles:
    'Internal/PORTALS_username_wireless-10-146-162-236.public.utexas.edu_PRODUCTION',
  systemId: 'username.FORK.exec.stampede2.CLI',
  appId: 'prtl.clone.username.FORK.compress-0.1u3-3.0',
  appUuid: '2934015787566109161-242ac11a-0001-005',
  workPath:
    '/work/04004/username/username/job-c55ecc23-a098-40f5-aea9-9baa99306e3a-007-compress-0-1u3_2020-07-09t15-56-37',
  archive: true,
  archivePath:
    'archive/jobs/2020-07-09/compress-0-1u3_2020-07-09t15-56-37-c55ecc23-a098-40f5-aea9-9baa99306e3a-007',
  archiveSystem: 'frontera.home.username',
  nodeCount: 1,
  processorsPerNode: 1,
  memoryPerNode: 1,
  maxHours: 2,
  inputs: {
    workingDirectory: 'agave://cep.home.username/COE332'
  },
  parameters: {
    compression_type: 'tgz'
  },
  remoteJobId: null,
  schedulerJobId: null,
  remoteQueue: 'debug',
  remoteSubmitted: null,
  remoteStarted: null,
  remoteEnded: null,
  remoteOutcome: null,
  submitRetries: 0,
  remoteStatusChecks: 0,
  failedStatusChecks: 0,
  lastStatusCheck: null,
  blockedCount: 0,
  visible: true,
  _links: {
    self: {
      href:
        'https://portals-api.tacc.utexas.edu/jobs/v2/c55ecc23-a098-40f5-aea9-9baa99306e3a-007'
    },
    app: {
      href:
        'https://portals-api.tacc.utexas.edu/apps/v2/prtl.clone.username.FORK.compress-0.1u3-3.0'
    },
    executionSystem: {
      href:
        'https://portals-api.tacc.utexas.edu/systems/v2/username.FORK.exec.stampede2.CLI'
    },
    archiveSystem: {
      href:
        'https://portals-api.tacc.utexas.edu/systems/v2/frontera.home.username'
    },
    archiveData: {
      href:
        'https://portals-api.tacc.utexas.edu/files/v2/listings/system/frontera.home.username/archive/jobs/2020-07-09/compress-0-1u3_2020-07-09t15-56-37-c55ecc23-a098-40f5-aea9-9baa99306e3a-007'
    },
    owner: {
      href: 'https://portals-api.tacc.utexas.edu/profiles/v2/username'
    },
    permissions: {
      href:
        'https://portals-api.tacc.utexas.edu/jobs/v2/c55ecc23-a098-40f5-aea9-9baa99306e3a-007/pems'
    },
    history: {
      href:
        'https://portals-api.tacc.utexas.edu/jobs/v2/c55ecc23-a098-40f5-aea9-9baa99306e3a-007/history'
    },
    metadata: {
      href:
        'https://portals-api.tacc.utexas.edu/meta/v2/data/?q=%7B%22associationIds%22%3A%22c55ecc23-a098-40f5-aea9-9baa99306e3a-007%22%7D'
    },
    notifications: {
      href:
        'https://portals-api.tacc.utexas.edu/notifications/v2/?associatedUuid=c55ecc23-a098-40f5-aea9-9baa99306e3a-007'
    }
  },
  _embedded: {
    metadata: []
  },
  archiveUrl:
    '/workbench/data-depot/agave/frontera.home.username/archive/jobs/2020-07-09/compress-0-1u3_2020-07-09t15-56-37-c55ecc23-a098-40f5-aea9-9baa99306e3a-007/',
  jupyterUrl:
    'https://jupyter.tacc.cloud/user/username/tree/tacc-work/archive/jobs/2020-07-09/compress-0-1u3_2020-07-09t15-56-37-c55ecc23-a098-40f5-aea9-9baa99306e3a-007'
};

export default jobDetailFixture;
