// TODOv3: dropV2Jobs
const jobsV2List = [
  {
    id: '3b03cb52-3951-4b05-8833-27af89b937e9-007',
    name: 'Compressing Files',
    appId: 'prtl.clone.username.FORK.zippy-0.2u2-2.0',
    ended: '2020-05-01T14:45:15.485Z',
    owner: 'username',
    roles:
      'Internal/PORTALS_username__cli-portals-username-localhost_PRODUCTION,Internal/PORTALS_username__cli-portals-username-20e6cb6628c5_PRODUCTION,Internal/PORTALS_username_DefaultApplication_PRODUCTION,Internal/everyone,Internal/PORTALS_username__cli-portals-username-9bc2fcf24b37_PRODUCTION,Internal/PORTALS_username__cli-portals-username-c65dd3106f9d_PRODUCTION',
    _links: {
      app: {
        href: 'https://portals-api.tacc.utexas.edu/apps/v2/prtl.clone.username.FORK.zippy-0.2u2-2.0',
      },
      self: {
        href: 'https://portals-api.tacc.utexas.edu/jobs/v2/3b03cb52-3951-4b05-8833-27af89b937e9-007',
      },
      owner: {
        href: 'https://portals-api.tacc.utexas.edu/profiles/v2/username',
      },
      history: {
        href: 'https://portals-api.tacc.utexas.edu/jobs/v2/3b03cb52-3951-4b05-8833-27af89b937e9-007/history',
      },
      metadata: {
        href: 'https://portals-api.tacc.utexas.edu/meta/v2/data/?q=%7B%22associationIds%22%3A%223b03cb52-3951-4b05-8833-27af89b937e9-007%22%7D',
      },
      archiveData: {
        href: 'https://portals-api.tacc.utexas.edu/files/v2/listings/system/frontera.home.username/archive/jobs/2020-07-09/compress-0-1u3_2020-07-09t15-56-37-c55ecc23-a098-40f5-aea9-9baa99306e3a-007',
      },
      permissions: {
        href: 'https://portals-api.tacc.utexas.edu/jobs/v2/3b03cb52-3951-4b05-8833-27af89b937e9-007/pems',
      },
      notification: [
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/b9003d00-2237-4c21-ab82-683c5ecf688f-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/685aed88-807c-4626-8469-707f34994a9d-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/83a01e6f-e142-4827-920a-b48a5c64345b-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/03087a6b-dbe4-4379-91ba-b855badd7b0c-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/4abf661d-41d7-4256-8a14-2a8b384d7870-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/874294cc-bc67-4e50-bdd8-c6f64a71b212-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/b4c3aaef-7ba8-4d0c-ae34-c519b0f81edc-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/ca7564e2-1872-4d27-bc23-a97e31c179d6-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/70405e54-a561-42d6-ae65-28004bca4979-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/4f543302-6166-4012-bc93-c46ede55ed87-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/748721a9-dea6-4930-9c98-146d65aed0d3-011',
          title: '*',
        },
      ],
      archiveSystem: {
        href: 'https://portals-api.tacc.utexas.edu/systems/v2/cloud.corral.work.username',
      },
      notifications: {
        href: 'https://portals-api.tacc.utexas.edu/notifications/v2/?associatedUuid=3b03cb52-3951-4b05-8833-27af89b937e9-007',
      },
      executionSystem: {},
    },
    inputs: {
      inputFiles: [
        'agave://cloud.corral.work.username/.agave%282%29%281%29.log',
      ],
    },
    status: 'FINISHED',
    appUuid: '6416433200988033516-242ac117-0001-005',
    archive: true,
    created: '2022-12-12T20:52:12.353Z',
    visible: true,
    accepted: '2022-12-12T20:52:12.345Z',
    maxHours: 2.0,
    systemId: 'test.exec.system',
    tenantId: 'portals',
    workPath:
      '/work/04004/username/username/job-c55ecc23-a098-40f5-aea9-9baa99306e3a-007-compress-0-1u3_2020-07-09t15-56-37',
    _embedded: {
      metadata: [],
    },
    nodeCount: 0,
    archiveUrl: '/workbench/data-depot/agave/cloud.corral.work.username/',
    jupyterUrl:
      'https://staging.jupyter.tacc.cloud/user/username/tree/tacc-work//',
    parameters: {
      filenames: '".agave(2)(1).log" ',
      zipfileName: '.agave(2)(1).log.zip',
      compression_type: 'zip',
    },
    archivePath:
      'archive/jobs/2020-07-09/compress-0-1u3_2020-07-09t15-56-37-c55ecc23-a098-40f5-aea9-9baa99306e3a-007',
    lastUpdated: '2022-12-12T20:52:12.353Z',
    remoteEnded: '2020-05-01T14:45:15.485Z',
    remoteJobId: 'None',
    remoteQueue: 'None',
    tenantQueue: 'aloe.jobq.portals.submit.DefaultQueue',
    blockedCount: 0,
    archiveSystem: 'cloud.corral.work.username',
    memoryPerNode: 0.0,
    remoteOutcome: 'None',
    remoteStarted: 'None',
    submitRetries: 0,
    schedulerJobId: 'None',
    lastStatusCheck: 'None',
    remoteSubmitted: 'None',
    archiveOnAppError: false,
    lastStatusMessage: 'JOBS_ACCEPTED Job accepted for processing.',
    processorsPerNode: 0,
    failedStatusChecks: 0,
    remoteStatusChecks: 0,
    display: {
      inputs: [
        {
          label: 'inputFiles',
          id: 'inputFiles',
          value: 'agave://cloud.corral.work.username/.agave%282%29%281%29.log',
        },
      ],
      parameters: [
        {
          label: 'filenames',
          id: 'inputFiles',
          value: 'agave://cloud.corral.work.username/.agave%282%29%281%29.log',
        },
        {
          label: 'zipFileName',
          id: 'zipFileName',
          value: '.agave(2)(1).log.zip',
        },
        {
          label: 'compression_type',
          id: 'compression_type',
          value: 'zip',
        },
      ],
      systemName: 'test.exec.system',
      applicationName: 'prtl.clone.username.FORK.zippy-0.2u2-2.0',
    },
  },
  {
    id: '793e9e90-53c3-4168-a26b-17230e2e4156-007',
    name: 'Compressing Files',
    appId: 'prtl.clone.username.FORK.zippy-0.2u2-2.0',
    ended: '2020-05-01T14:45:15.485Z',
    owner: 'username',
    roles:
      'Internal/PORTALS_username__cli-portals-username-localhost_PRODUCTION,Internal/PORTALS_username__cli-portals-username-20e6cb6628c5_PRODUCTION,Internal/PORTALS_username_DefaultApplication_PRODUCTION,Internal/everyone,Internal/PORTALS_username__cli-portals-username-9bc2fcf24b37_PRODUCTION,Internal/PORTALS_username__cli-portals-username-c65dd3106f9d_PRODUCTION',
    _links: {
      app: {
        href: 'https://portals-api.tacc.utexas.edu/apps/v2/prtl.clone.username.FORK.zippy-0.2u2-2.0',
      },
      self: {
        href: 'https://portals-api.tacc.utexas.edu/jobs/v2/3b03cb52-3951-4b05-8833-27af89b937e9-007',
      },
      owner: {
        href: 'https://portals-api.tacc.utexas.edu/profiles/v2/username',
      },
      history: {
        href: 'https://portals-api.tacc.utexas.edu/jobs/v2/3b03cb52-3951-4b05-8833-27af89b937e9-007/history',
      },
      metadata: {
        href: 'https://portals-api.tacc.utexas.edu/meta/v2/data/?q=%7B%22associationIds%22%3A%223b03cb52-3951-4b05-8833-27af89b937e9-007%22%7D',
      },
      archiveData: {
        href: 'https://portals-api.tacc.utexas.edu/files/v2/listings/system/frontera.home.username/archive/jobs/2020-07-09/compress-0-1u3_2020-07-09t15-56-37-c55ecc23-a098-40f5-aea9-9baa99306e3a-007',
      },
      permissions: {
        href: 'https://portals-api.tacc.utexas.edu/jobs/v2/3b03cb52-3951-4b05-8833-27af89b937e9-007/pems',
      },
      notification: [
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/b9003d00-2237-4c21-ab82-683c5ecf688f-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/685aed88-807c-4626-8469-707f34994a9d-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/83a01e6f-e142-4827-920a-b48a5c64345b-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/03087a6b-dbe4-4379-91ba-b855badd7b0c-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/4abf661d-41d7-4256-8a14-2a8b384d7870-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/874294cc-bc67-4e50-bdd8-c6f64a71b212-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/b4c3aaef-7ba8-4d0c-ae34-c519b0f81edc-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/ca7564e2-1872-4d27-bc23-a97e31c179d6-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/70405e54-a561-42d6-ae65-28004bca4979-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/4f543302-6166-4012-bc93-c46ede55ed87-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/748721a9-dea6-4930-9c98-146d65aed0d3-011',
          title: '*',
        },
      ],
      archiveSystem: {
        href: 'https://portals-api.tacc.utexas.edu/systems/v2/cloud.corral.work.username',
      },
      notifications: {
        href: 'https://portals-api.tacc.utexas.edu/notifications/v2/?associatedUuid=3b03cb52-3951-4b05-8833-27af89b937e9-007',
      },
      executionSystem: {},
    },
    inputs: {
      inputFiles: [
        'agave://cloud.corral.work.username/.agave%282%29%281%29.log',
      ],
    },
    status: 'FINISHED',
    appUuid: '6416433200988033516-242ac117-0001-005',
    archive: true,
    created: '2022-12-12T20:52:12.353Z',
    visible: true,
    accepted: '2022-12-12T20:52:12.345Z',
    maxHours: 2.0,
    systemId: 'test.exec.system',
    tenantId: 'portals',
    workPath:
      '/work/04004/username/username/job-c55ecc23-a098-40f5-aea9-9baa99306e3a-007-compress-0-1u3_2020-07-09t15-56-37',
    _embedded: {
      metadata: [],
    },
    nodeCount: 0,
    archiveUrl: '/workbench/data-depot/agave/cloud.corral.work.username/',
    jupyterUrl:
      'https://staging.jupyter.tacc.cloud/user/username/tree/tacc-work//',
    parameters: {
      filenames: '".agave(2)(1).log" ',
      zipfileName: '.agave(2)(1).log.zip',
      compression_type: 'zip',
    },
    archivePath:
      'archive/jobs/2020-07-09/compress-0-1u3_2020-07-09t15-56-37-c55ecc23-a098-40f5-aea9-9baa99306e3a-007',
    lastUpdated: '2022-12-12T20:52:12.353Z',
    remoteEnded: '2020-05-01T14:45:15.485Z',
    remoteJobId: 'None',
    remoteQueue: 'None',
    tenantQueue: 'aloe.jobq.portals.submit.DefaultQueue',
    blockedCount: 0,
    archiveSystem: 'cloud.corral.work.username',
    memoryPerNode: 0.0,
    remoteOutcome: 'None',
    remoteStarted: 'None',
    submitRetries: 0,
    schedulerJobId: 'None',
    lastStatusCheck: 'None',
    remoteSubmitted: 'None',
    archiveOnAppError: false,
    lastStatusMessage: 'JOBS_ACCEPTED Job accepted for processing.',
    processorsPerNode: 0,
    failedStatusChecks: 0,
    remoteStatusChecks: 0,
    display: {
      inputs: [
        {
          label: 'inputFiles',
          id: 'inputFiles',
          value: 'agave://cloud.corral.work.username/.agave%282%29%281%29.log',
        },
      ],
      parameters: [
        {
          label: 'filenames',
          id: 'inputFiles',
          value: 'agave://cloud.corral.work.username/.agave%282%29%281%29.log',
        },
        {
          label: 'zipFileName',
          id: 'zipFileName',
          value: '.agave(2)(1).log.zip',
        },
        {
          label: 'compression_type',
          id: 'compression_type',
          value: 'zip',
        },
      ],
      systemName: 'test.exec.system',
      applicationName: 'prtl.clone.username.FORK.zippy-0.2u2-2.0',
    },
  },
  {
    id: '13ec13f2-4bec-4ec8-af9b-caa8913099ca-007',
    name: 'Compressing Files',
    appId: 'prtl.clone.username.FORK.zippy-0.2u2-2.0',
    ended: '2020-05-01T14:45:15.485Z',
    owner: 'username',
    roles:
      'Internal/PORTALS_username__cli-portals-username-localhost_PRODUCTION,Internal/PORTALS_username__cli-portals-username-20e6cb6628c5_PRODUCTION,Internal/PORTALS_username_DefaultApplication_PRODUCTION,Internal/everyone,Internal/PORTALS_username__cli-portals-username-9bc2fcf24b37_PRODUCTION,Internal/PORTALS_username__cli-portals-username-c65dd3106f9d_PRODUCTION',
    _links: {
      app: {
        href: 'https://portals-api.tacc.utexas.edu/apps/v2/prtl.clone.username.FORK.zippy-0.2u2-2.0',
      },
      self: {
        href: 'https://portals-api.tacc.utexas.edu/jobs/v2/3b03cb52-3951-4b05-8833-27af89b937e9-007',
      },
      owner: {
        href: 'https://portals-api.tacc.utexas.edu/profiles/v2/username',
      },
      history: {
        href: 'https://portals-api.tacc.utexas.edu/jobs/v2/3b03cb52-3951-4b05-8833-27af89b937e9-007/history',
      },
      metadata: {
        href: 'https://portals-api.tacc.utexas.edu/meta/v2/data/?q=%7B%22associationIds%22%3A%223b03cb52-3951-4b05-8833-27af89b937e9-007%22%7D',
      },
      archiveData: {
        href: 'https://portals-api.tacc.utexas.edu/files/v2/listings/system/frontera.home.username/archive/jobs/2020-07-09/compress-0-1u3_2020-07-09t15-56-37-c55ecc23-a098-40f5-aea9-9baa99306e3a-007',
      },
      permissions: {
        href: 'https://portals-api.tacc.utexas.edu/jobs/v2/3b03cb52-3951-4b05-8833-27af89b937e9-007/pems',
      },
      notification: [
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/b9003d00-2237-4c21-ab82-683c5ecf688f-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/685aed88-807c-4626-8469-707f34994a9d-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/83a01e6f-e142-4827-920a-b48a5c64345b-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/03087a6b-dbe4-4379-91ba-b855badd7b0c-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/4abf661d-41d7-4256-8a14-2a8b384d7870-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/874294cc-bc67-4e50-bdd8-c6f64a71b212-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/b4c3aaef-7ba8-4d0c-ae34-c519b0f81edc-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/ca7564e2-1872-4d27-bc23-a97e31c179d6-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/70405e54-a561-42d6-ae65-28004bca4979-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/4f543302-6166-4012-bc93-c46ede55ed87-011',
          title: '*',
        },
        {
          href: 'https://portals-api.tacc.utexas.edu/notifications/v2/748721a9-dea6-4930-9c98-146d65aed0d3-011',
          title: '*',
        },
      ],
      archiveSystem: {
        href: 'https://portals-api.tacc.utexas.edu/systems/v2/cloud.corral.work.username',
      },
      notifications: {
        href: 'https://portals-api.tacc.utexas.edu/notifications/v2/?associatedUuid=3b03cb52-3951-4b05-8833-27af89b937e9-007',
      },
      executionSystem: {},
    },
    inputs: {
      inputFiles: [
        'agave://cloud.corral.work.username/.agave%282%29%281%29.log',
      ],
    },
    status: 'FINISHED',
    appUuid: '6416433200988033516-242ac117-0001-005',
    archive: true,
    created: '2022-12-12T20:52:12.353Z',
    visible: true,
    accepted: '2022-12-12T20:52:12.345Z',
    maxHours: 2.0,
    systemId: 'test.exec.system',
    tenantId: 'portals',
    workPath:
      '/work/04004/username/username/job-c55ecc23-a098-40f5-aea9-9baa99306e3a-007-compress-0-1u3_2020-07-09t15-56-37',
    _embedded: {
      metadata: [],
    },
    nodeCount: 0,
    archiveUrl: '/workbench/data-depot/agave/cloud.corral.work.username/',
    jupyterUrl:
      'https://staging.jupyter.tacc.cloud/user/username/tree/tacc-work//',
    parameters: {
      filenames: '".agave(2)(1).log" ',
      zipfileName: '.agave(2)(1).log.zip',
      compression_type: 'zip',
    },
    archivePath:
      'archive/jobs/2020-07-09/compress-0-1u3_2020-07-09t15-56-37-c55ecc23-a098-40f5-aea9-9baa99306e3a-007',
    lastUpdated: '2022-12-12T20:52:12.353Z',
    remoteEnded: '2020-05-01T14:45:15.485Z',
    remoteJobId: 'None',
    remoteQueue: 'None',
    tenantQueue: 'aloe.jobq.portals.submit.DefaultQueue',
    blockedCount: 0,
    archiveSystem: 'cloud.corral.work.username',
    memoryPerNode: 0.0,
    remoteOutcome: 'None',
    remoteStarted: 'None',
    submitRetries: 0,
    schedulerJobId: 'None',
    lastStatusCheck: 'None',
    remoteSubmitted: 'None',
    archiveOnAppError: false,
    lastStatusMessage: 'JOBS_ACCEPTED Job accepted for processing.',
    processorsPerNode: 0,
    failedStatusChecks: 0,
    remoteStatusChecks: 0,
    display: {
      inputs: [
        {
          label: 'inputFiles',
          id: 'inputFiles',
          value: 'agave://cloud.corral.work.username/.agave%282%29%281%29.log',
        },
      ],
      parameters: [
        {
          label: 'filenames',
          id: 'inputFiles',
          value: 'agave://cloud.corral.work.username/.agave%282%29%281%29.log',
        },
        {
          label: 'zipFileName',
          id: 'zipFileName',
          value: '.agave(2)(1).log.zip',
        },
        {
          label: 'compression_type',
          id: 'compression_type',
          value: 'zip',
        },
      ],
      systemName: 'test.exec.system',
      applicationName: 'prtl.clone.username.FORK.zippy-0.2u2-2.0',
    },
  },
];

export default jobsV2List;
