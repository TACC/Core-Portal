const executionSystemDetailFixture = {
  uuid: '7451060998492066281-242ac116-0001-006',
  id: 'maxmunstermann.FORK.exec.stampede2.CLI',
  owner: 'maxmunstermann',
  type: 'EXECUTION',
  name: 'Stampede2 CLI Execution Host',
  site: 'portal.dev',
  available: true,
  description: 'Exec system for user: maxmunstermann',
  environment: null,
  executionType: 'CLI',
  maxSystemJobs: 50,
  maxSystemJobsPerUser: 4,
  scheduler: 'FORK',
  scratchDir: '/work/05724/maxmunstermann/',
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
    homeDir: '/work/05724/maxmunstermann',
    auth: {
      type: 'SSHKEYS',
      username: '',
      publicKey: '',
      privateKey: ''
    }
  },
  workDir: '/work/05724/maxmunstermann/',
  revision: 1,
  default: false,
  public: false,
  globalDefault: false,
  lastModified: '2019-06-25T12:24:38-05:00'
};

export default executionSystemDetailFixture;
