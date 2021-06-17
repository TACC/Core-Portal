const appDetailSlurmFixture = {
  definition: {
    id: 'prtl.clone.maxmunstermann.TACC-ACI.qgis-3.48-5.0',
    name: 'prtl.clone.maxmunstermann.TACC-ACI.qgis-3.48',
    icon: null,
    uuid: '713780412274774506-242ac115-0001-005',
    parallelism: 'PARALLEL',
    defaultProcessorsPerNode: 20,
    defaultMemoryPerNode: 1,
    defaultNodeCount: 1,
    defaultMaxRunTime: '04:00:00',
    defaultQueue: 'normal',
    version: '5.0',
    revision: 2,
    isPublic: false,
    helpURI: null,
    label: 'QGIS',
    owner: 'maxmunstermann',
    shortDescription: 'Run an interactive QGIS session on Stampede2.',
    longDescription:
      'Run an interactive QGIS session on Stampede2 for 4 hours. Be sure to exit the QGIS application when you are finished with the session or any files saved will not be archived with the job.',
    tags: [
      'DCV',
      'desktop',
      'QGIS',
      'Interactive',
      'hideNodeCount',
      'hideProcessorsPerNode',
      'visualization',
      'appCategory:Visualization',
      'appIcon:qgis',
      'cloneRevision:5'
    ],
    ontology: [],
    executionType: 'HPC',
    executionSystem: 'maxmunstermann.TACC-ACI.exec.stampede2.HPC',
    deploymentPath: '.APPDATA/prtl.clone.maxmunstermann.TACC-ACI.qgis-3.48-5.0',
    deploymentSystem: 'frontera.home.maxmunstermann',
    templatePath: 'wrapper.sh',
    testPath: 'test/test.sh',
    checkpointable: false,
    lastModified: '2020-07-28T21:41:51-05:00',
    modules: ['load tacc-singularity'],
    available: true,
    inputs: [
      {
        id: 'workingDirectory',
        value: {
          validator: '',
          visible: true,
          required: true,
          order: 0,
          enquote: false,
          default: ''
        },
        details: {
          label: 'Working Directory',
          description:
            "The directory containing the files that you want to work on. This directory and its files will be copied to where your QGIS session runs. You can drag the link for the directory from the Data Browser on the left, or click the 'Select Input' button and then select the directory.",
          argument: null,
          showArgument: false,
          repeatArgument: false
        },
        semantics: {
          minCardinality: 1,
          maxCardinality: 1,
          ontology: ['xsd:string'],
          fileTypes: ['raw-0']
        }
      }
    ],
    parameters: [
      {
        id: 'desktop_resolution',
        value: {
          visible: true,
          required: true,
          type: 'enumeration',
          order: 0,
          enquote: false,
          default: '1280x800',
          enum_values: [
            { '800x600': '800x600' },
            { '1280x800': '1280x800' },
            { '1920x1080': '1920x1080' },
            { '1920x1200': '1920x1200' },
            { '1600x1200': '1600x1200' },
            { '2560x1600': '2560x1600' }
          ]
        },
        details: {
          label: 'Desktop Resolution',
          description:
            'Set the desktop screen size for your visualization session (only used if VNC interactive session is created).',
          argument: null,
          showArgument: false,
          repeatArgument: false
        },
        semantics: {
          minCardinality: 1,
          maxCardinality: 1,
          ontology: ['xs:enumeration', 'xs:string']
        }
      },
      {
        id: '_webhook_base_url',
        value: {
          visible: true,
          required: true,
          type: 'string',
          order: 1,
          enquote: false,
          default: null,
          validator: null
        },
        details: {
          label: 'Base portal webhook url.',
          description: null,
          argument: null,
          showArgument: false,
          repeatArgument: false
        },
        semantics: {
          minCardinality: 1,
          maxCardinality: 1,
          ontology: ['xs:string']
        }
      }
    ],
    outputs: [],
    _links: {
      self: {
        href:
          'https://portals-api.tacc.utexas.edu/apps/v2/prtl.clone.maxmunstermann.TACC-ACI.qgis-3.48-5.0'
      },
      executionSystem: {
        href:
          'https://portals-api.tacc.utexas.edu/systems/v2/maxmunstermann.TACC-ACI.exec.stampede2.HPC'
      },
      storageSystem: {
        href:
          'https://portals-api.tacc.utexas.edu/systems/v2/frontera.home.maxmunstermann'
      },
      history: {
        href:
          'https://portals-api.tacc.utexas.edu/apps/v2/prtl.clone.maxmunstermann.TACC-ACI.qgis-3.48-5.0/history'
      },
      metadata: {
        href:
          'https://portals-api.tacc.utexas.edu/meta/v2/data/?q=%7B%22associationIds%22%3A%22713780412274774506-242ac115-0001-005%22%7D'
      },
      owner: {
        href: 'https://portals-api.tacc.utexas.edu/profiles/v2/maxmunstermann'
      },
      permissions: {
        href:
          'https://portals-api.tacc.utexas.edu/apps/v2/prtl.clone.maxmunstermann.TACC-ACI.qgis-3.48-5.0/pems'
      }
    }
  },
  systemHasKeys: false,
  pushKeysSystem: {},
  exec_sys: {
    uuid: '8646989280067907095-242ac116-0001-006',
    id: 'maxmunstermann.TACC-ACI.exec.stampede2.HPC',
    owner: 'maxmunstermann',
    type: 'EXECUTION',
    name: 'Stampede2 SLURM Execution Host',
    site: 'portal.dev',
    available: true,
    description: 'Exec system for user: maxmunstermann',
    environment: null,
    executionType: 'HPC',
    maxSystemJobs: 50,
    maxSystemJobsPerUser: 4,
    scheduler: 'SLURM',
    scratchDir: '/scratch/05724/maxmunstermann/',
    startupScript: './bashrc',
    status: 'UP',
    login: {
      proxy: null,
      protocol: 'SSH',
      port: 22,
      auth: { type: 'SSHKEYS', username: '', publicKey: '', privateKey: '' },
      host: 'stampede2.tacc.utexas.edu'
    },
    queues: [
      {
        name: 'normal',
        maxJobs: 50,
        maxUserJobs: 5,
        maxNodes: 256,
        maxProcessorsPerNode: 17408,
        maxMemoryPerNode: 96,
        customDirectives: '-A TACC-ACI',
        default: true,
        maxRequestedTime: '999:59:59'
      },
      {
        name: 'skx-normal',
        maxJobs: 25,
        maxUserJobs: -1,
        maxNodes: 128,
        maxProcessorsPerNode: 6144,
        maxMemoryPerNode: 192,
        customDirectives: '-A TACC-ACI',
        default: false,
        maxRequestedTime: '999:59:59'
      },
      {
        name: 'development',
        maxJobs: 1,
        maxUserJobs: 1,
        maxNodes: 4,
        maxProcessorsPerNode: 272,
        maxMemoryPerNode: 96,
        customDirectives: '-A TACC-ACI',
        default: false,
        maxRequestedTime: '999:59:59'
      },
      {
        name: 'flat-quadrant',
        maxJobs: 4,
        maxUserJobs: -1,
        maxNodes: 32,
        maxProcessorsPerNode: 2176,
        maxMemoryPerNode: 96,
        customDirectives: '-A TACC-ACI',
        default: false,
        maxRequestedTime: '999:59:59'
      },
      {
        name: 'large',
        maxJobs: 5,
        maxUserJobs: -1,
        maxNodes: 2046,
        maxProcessorsPerNode: 139264,
        maxMemoryPerNode: 96,
        customDirectives: '-A TACC-ACI',
        default: false,
        maxRequestedTime: '999:59:59'
      },
      {
        name: 'skx-large',
        maxJobs: 3,
        maxUserJobs: -1,
        maxNodes: 865,
        maxProcessorsPerNode: 41664,
        maxMemoryPerNode: 192,
        customDirectives: '-A TACC-ACI',
        default: false,
        maxRequestedTime: '999:59:59'
      },
      {
        name: 'skx-dev',
        maxJobs: 1,
        maxUserJobs: -1,
        maxNodes: 4,
        maxProcessorsPerNode: 192,
        maxMemoryPerNode: 192,
        customDirectives: '-A TACC-ACI',
        default: false,
        maxRequestedTime: '999:59:59'
      }
    ],
    storage: {
      proxy: null,
      protocol: 'SFTP',
      mirror: false,
      port: 22,
      publicAppsDir: null,
      host: 'stampede2.tacc.utexas.edu',
      rootDir: '/',
      homeDir: '/work/05724/maxmunstermann',
      auth: { type: 'SSHKEYS', username: '', publicKey: '', privateKey: '' }
    },
    workDir: '/work/05724/maxmunstermann/',
    revision: 1,
    default: false,
    public: false,
    globalDefault: false,
    lastModified: '2020-07-31T11:10:01-05:00'
  },
  license: { type: null },
  appListing: {}
};

export default appDetailSlurmFixture;
