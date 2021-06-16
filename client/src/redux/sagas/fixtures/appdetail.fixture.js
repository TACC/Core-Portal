const appDetailFixture = {
  definition: {
    id: 'prtl.clone.username.FORK.compress-0.1u3-3.0',
    name: 'prtl.clone.username.FORK.compress-0.1u3',
    icon: '',
    uuid: '2934015787566109161-242ac11a-0001-005',
    parallelism: 'SERIAL',
    defaultProcessorsPerNode: 1,
    defaultMemoryPerNode: 1,
    defaultNodeCount: 1,
    defaultMaxRunTime: '02:00:00',
    defaultQueue: 'debug',
    version: '3.0',
    revision: 2,
    isPublic: false,
    helpURI: null,
    label: 'Compress folder',
    owner: 'username',
    shortDescription: 'Compress a folder for download.',
    longDescription: 'Compress a folder for download.',
    tags: ['appCategory:Utilities', 'appIcon:compress', 'cloneRevision:3'],
    ontology: [],
    executionType: 'CLI',
    executionSystem: 'username.FORK.exec.stampede2.CLI',
    deploymentPath: '.APPDATA/prtl.clone.username.FORK.compress-0.1u3-3.0',
    deploymentSystem: 'cep.home.username',
    templatePath: 'wrapper.sh',
    testPath: 'test/test.sh',
    checkpointable: false,
    lastModified: '2019-03-25T16:23:04-05:00',
    modules: [],
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
          default: 'agave://cep.storage.default/'
        },
        details: {
          label: 'Target Path to be Compressed',
          description: 'The directory or file to be compressed.',
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
        id: 'compression_type',
        value: {
          visible: true,
          required: true,
          type: 'enumeration',
          order: 0,
          enquote: false,
          default: 'tgz',
          enum_values: [
            {
              tgz: 'tar.gz'
            },
            {
              zip: 'zip'
            }
          ]
        },
        details: {
          label: 'Compression Type',
          description:
            'Select the type of compressed file, either a Gzipped TAR file (.tar.gz) or a Zip file (.zip).',
          argument: null,
          showArgument: false,
          repeatArgument: false
        },
        semantics: {
          minCardinality: 1,
          maxCardinality: 1,
          ontology: ['xs:enumeration', 'xs:string']
        }
      }
    ],
    outputs: [],
    _links: {
      self: {
        href:
          'https://portals-api.tacc.utexas.edu/apps/v2/prtl.clone.username.FORK.compress-0.1u3-3.0'
      },
      executionSystem: {
        href:
          'https://portals-api.tacc.utexas.edu/systems/v2/username.FORK.exec.stampede2.CLI'
      },
      storageSystem: {
        href: 'https://portals-api.tacc.utexas.edu/systems/v2/cep.home.username'
      },
      history: {
        href:
          'https://portals-api.tacc.utexas.edu/apps/v2/prtl.clone.username.FORK.compress-0.1u3-3.0/history'
      },
      metadata: {
        href:
          'https://portals-api.tacc.utexas.edu/meta/v2/data/?q=%7B%22associationIds%22%3A%222934015787566109161-242ac11a-0001-005%22%7D'
      },
      owner: {
        href: 'https://portals-api.tacc.utexas.edu/profiles/v2/username'
      },
      permissions: {
        href:
          'https://portals-api.tacc.utexas.edu/apps/v2/prtl.clone.username.FORK.compress-0.1u3-3.0/pems'
      }
    },
    resource: 'stampede2.tacc.utexas.edu',
    scheduler: 'FORK'
  },
  systemHasKeys: false,
  pushKeysSystem: {},
  exec_sys: {
    uuid: '4152270341813113321-242ac116-0001-006',
    id: 'username.FORK.exec.stampede2.CLI',
    owner: 'username',
    type: 'EXECUTION',
    name: 'Stampede2 CLI Execution Host',
    site: 'portal.dev',
    available: true,
    description: 'Exec system for user: username',
    environment: null,
    executionType: 'CLI',
    maxSystemJobs: 50,
    maxSystemJobsPerUser: 4,
    scheduler: 'FORK',
    scratchDir: '/work/04004/username/',
    startupScript: './bashrc',
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
      host: 'stampede2.tacc.utexas.edu'
    },
    queues: [
      {
        name: 'debug',
        maxJobs: 100,
        maxUserJobs: 10,
        maxNodes: 1,
        maxProcessorsPerNode: 1,
        maxMemoryPerNode: 1,
        customDirectives: null,
        default: true,
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
      homeDir: '/work/04004/username',
      auth: {
        type: 'SSHKEYS',
        username: '',
        publicKey: '',
        privateKey: ''
      }
    },
    workDir: '/work/04004/username/',
    revision: 1,
    default: false,
    public: false,
    globalDefault: false,
    lastModified: '2019-03-26T15:59:45-05:00'
  },
  license: {
    type: null
  },
  appListing: {}
};

export default appDetailFixture;
