const namdFixture = {
  definition: {
    id: 'namd-frontera-2.1.3u2',
    name: 'namd-frontera',
    icon: null,
    uuid: '836049197363696106-242ac112-0001-005',
    parallelism: 'PARALLEL',
    defaultProcessorsPerNode: 1,
    defaultMemoryPerNode: 1,
    defaultNodeCount: 1,
    defaultMaxRunTime: null,
    defaultQueue: null,
    version: '2.1.3',
    revision: 2,
    isPublic: true,
    helpURI: 'https://www.ks.uiuc.edu/Research/namd/',
    label: 'NAMD',
    owner: 'wma_prtl',
    shortDescription:
      'NAMD is a parallel molecular dynamics code designed for high-performance simulation of large biomolecular systems.',
    longDescription:
      'NAMD is a parallel molecular dynamics code designed for high-performance simulation of large biomolecular systems. NAMD was developed by the Theoretical and Computational Biophysics Group in the Beckman Institute for Advanced Science and Technology at the University of Illinois at Urbana-Champaign',
    tags: ['appCategory:Simulation'],
    ontology: [],
    executionType: 'HPC',
    executionSystem: 'frontera.community.exec.frontera',
    deploymentPath: '/api/2/apps/namd-frontera-2.1.3u2.zip',
    deploymentSystem: 'cep.storage.default',
    templatePath: 'wrapper.sh',
    testPath: 'test/test.sh',
    checkpointable: false,
    lastModified: '2020-07-06T10:26:21-05:00',
    modules: ['load namd/2.13'],
    available: true,
    inputs: [
      {
        id: 'inputDirectory',
        value: {
          validator: null,
          visible: true,
          required: true,
          order: 0,
          enquote: false,
          default: ''
        },
        details: {
          label: 'Input Directory',
          description:
            'The directory containing your NAMD input files as well as your configuration file.',
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
        id: 'confFile',
        value: {
          visible: true,
          required: true,
          type: 'string',
          order: 0,
          enquote: false,
          default: null,
          validator: null
        },
        details: {
          label: 'Configuration file',
          description:
            'The filename only of the NAMD configuration file (also called a config file, .conf file, or .namd file). This file should reside in the Input Directory specified.',
          argument: null,
          showArgument: false,
          repeatArgument: false
        },
        semantics: {
          minCardinality: 1,
          maxCardinality: 1,
          ontology: []
        }
      },
      {
        id: 'namdCommandLineOptions',
        value: {
          visible: true,
          required: true,
          type: 'enumeration',
          order: 0,
          enquote: false,
          default:
            '+ppn 13 +pemap 2-26:2,30-54:2,3-27:2,31-55:2 +commap 0,28,1,29',
          enum_values: [
            {
              '+ppn 13 +pemap 2-26:2,30-54:2,3-27:2,31-55:2 +commap 0,28,1,29':
                '4 tasks per node'
            },
            {
              '+ppn 6 +pemap 2-12:2,16-26:2,30-40:2,44-54:2,3-13:2,17-27:2,31-41:2,45-55:2 +commap 0,14,28,42,1,15,29,43':
                '8 tasks per node'
            }
          ]
        },
        details: {
          label: 'Tasks per node',
          description:
            'TACC staff recommends that users attempt runs with 4 tasks per node and 8 tasks per node (scales better at large number of nodes) and then pick the configuration that provides the best performance.',
          argument: null,
          showArgument: false,
          repeatArgument: false
        },
        semantics: {
          minCardinality: 1,
          maxCardinality: 1,
          ontology: []
        }
      }
    ],
    outputs: [],
    _links: {
      self: {
        href:
          'https://portals-api.tacc.utexas.edu/apps/v2/namd-frontera-2.1.3u2'
      },
      executionSystem: {
        href:
          'https://portals-api.tacc.utexas.edu/systems/v2/frontera.community.exec.frontera'
      },
      storageSystem: {
        href:
          'https://portals-api.tacc.utexas.edu/systems/v2/cep.storage.default'
      },
      history: {
        href:
          'https://portals-api.tacc.utexas.edu/apps/v2/namd-frontera-2.1.3u2/history'
      },
      metadata: {
        href:
          'https://portals-api.tacc.utexas.edu/meta/v2/data/?q=%7B%22associationIds%22%3A%22836049197363696106-242ac112-0001-005%22%7D'
      },
      owner: {
        href: 'https://portals-api.tacc.utexas.edu/profiles/v2/wma_prtl'
      },
      permissions: {
        href:
          'https://portals-api.tacc.utexas.edu/apps/v2/namd-frontera-2.1.3u2/pems'
      }
    }
  },
  systemHasKeys: false,
  pushKeysSystem: {
    owner: 'wma_prtl',
    available: true,
    description: 'My Data on Frontera for cep_user',
    type: 'STORAGE',
    uuid: '6719017087916839402-242ac118-0001-006',
    revision: 2,
    site: 'cep',
    default: false,
    public: false,
    globalDefault: false,
    name: 'My Data (Frontera)',
    id: 'frontera.home.cep_user',
    status: 'UP',
    storage: {
      proxy: null,
      protocol: 'SFTP',
      mirror: false,
      port: 22,
      publicAppsDir: null,
      host: 'frontera.tacc.utexas.edu',
      rootDir: '/home1/01234/cep_user',
      homeDir: '/',
      auth: {
        type: 'SSHKEYS',
        username: '',
        publicKey: '',
        privateKey: ''
      }
    },
    absolutePath: null
  },
  resource: 'frontera.tacc.utexas.edu',
  scheduler: 'SLURM',
  exec_sys: {
    uuid: '7187142604918287894-242ac118-0001-006',
    id: 'frontera.community.exec.frontera',
    owner: 'wma_prtl',
    type: 'EXECUTION',
    name: 'TACC Frontera HPC Community Execution System',
    site: 'tacc.utexas.edu',
    available: true,
    description:
      'Frontera has two computing subsystems, a primary computing system focused on double precision performance, and a second subsystem focused on single precision streaming-memory computing.',
    environment: null,
    executionType: 'HPC',
    maxSystemJobs: 500,
    maxSystemJobsPerUser: 250,
    scheduler: 'SLURM',
    scratchDir: '/scratch1/04957/wma_prtl/',
    startupScript: '~/.bashrc',
    status: 'UP',
    login: {
      proxy: null,
      protocol: 'SSH',
      port: 22,
      auth: {
        type: 'SSHKEYS',
        username: '',
        publicKey: '',
        privateKey: ''
      },
      host: 'frontera.tacc.utexas.edu'
    },
    queues: [
      {
        name: 'development',
        maxJobs: -1,
        maxUserJobs: 1,
        maxNodes: 40,
        maxProcessorsPerNode: 2240,
        maxMemoryPerNode: 192,
        customDirectives: '-A TACC-ACI',
        default: false,
        maxRequestedTime: '02:00:00'
      },
      {
        name: 'flex',
        maxJobs: -1,
        maxUserJobs: 50,
        maxNodes: 128,
        maxProcessorsPerNode: 7168,
        maxMemoryPerNode: 192,
        customDirectives: '-A TACC-ACI',
        default: false,
        maxRequestedTime: '48:00:00'
      },
      {
        name: 'rtx',
        maxJobs: -1,
        maxUserJobs: 5,
        maxNodes: 22,
        maxProcessorsPerNode: -1,
        maxMemoryPerNode: 128,
        customDirectives: '-A TACC-ACI',
        default: false,
        maxRequestedTime: '48:00:00'
      },
      {
        name: 'rtx-dev',
        maxJobs: -1,
        maxUserJobs: 2,
        maxNodes: 2,
        maxProcessorsPerNode: -1,
        maxMemoryPerNode: 128,
        customDirectives: '-A TACC-ACI',
        default: false,
        maxRequestedTime: '02:00:00'
      },
      {
        name: 'normal',
        maxJobs: -1,
        maxUserJobs: 50,
        maxNodes: 512,
        maxProcessorsPerNode: 28672,
        maxMemoryPerNode: 192,
        customDirectives: '-A TACC-ACI',
        default: true,
        maxRequestedTime: '48:00:00'
      },
      {
        name: 'nvdimm',
        maxJobs: -1,
        maxUserJobs: 2,
        maxNodes: 4,
        maxProcessorsPerNode: 112,
        maxMemoryPerNode: 2150,
        customDirectives: '-A TACC-ACI',
        default: false,
        maxRequestedTime: '48:00:00'
      }
    ],
    storage: {
      proxy: null,
      protocol: 'SFTP',
      mirror: false,
      port: 22,
      publicAppsDir: null,
      host: 'frontera.tacc.utexas.edu',
      rootDir: '/',
      homeDir: '/scratch1/04957/wma_prtl/',
      auth: {
        type: 'SSHKEYS',
        username: '',
        publicKey: '',
        privateKey: ''
      }
    },
    workDir: '/work/04957/wma_prtl/',
    revision: 9,
    default: false,
    public: true,
    globalDefault: false,
    lastModified: '2020-07-02T13:44:46-05:00'
  },
  license: { type: null },
  appListing: {}
};

export default namdFixture;
