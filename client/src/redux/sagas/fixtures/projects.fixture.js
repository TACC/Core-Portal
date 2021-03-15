export const projectsListingFixture = [
  {
    owner: null,
    available: true,
    description: 'Test Project Title',
    type: 'STORAGE',
    uuid: null,
    revision: null,
    site: null,
    default: false,
    public: false,
    globalDefault: false,
    name: 'PROJECT-3',
    id: 'test.site.project.PROJECT-3',
    status: 'UP',
    storage: {
      proxy: null,
      protocol: null,
      mirror: false,
      port: null,
      publicAppsDir: null,
      host: null,
      rootDir: null,
      homeDir: null,
      auth: {
        type: 'SSHKEYS',
        username: '',
        publicKey: '',
        privateKey: ''
      }
    },
    absolutePath: '/corral-repl/tacc/aci/CEP/projects/PROJECT-3'
  }
];

export const projectMetadataResponse = {
  title: 'My Project',
  projectId: 'TEST-1',
  description: 'Long description of shared workspace',
  created: '2020-12-08T16:34:54.354843+00:00',
  lastModified: '2020-12-08T16:34:54.828181+00:00',
  owner: {
    last_name: 'Name',
    first_name: 'User',
    email: 'user@username.com',
    username: 'username'
  },
  pi: {
    last_name: 'Name',
    first_name: 'User',
    email: 'user@username.com',
    username: 'username'
  },
  coPis: [
    {
      last_name: 'Pi',
      first_name: 'Co',
      email: 'user@username.com',
      username: 'copi'
    }
  ],
  teamMembers: [
    {
      last_name: 'Member',
      first_name: 'Team',
      email: 'user@username.com',
      username: 'teammember'
    }
  ]
};

export const projectMetadataFixture = {
  title: 'My Project',
  description: 'Long description of shared workspace',
  projectId: 'TEST-1',
  members: [
    {
      user: {
        username: 'username',
        first_name: 'User',
        last_name: 'Name',
        email: 'user@username.com'
      },
      access: 'owner'
    },
    {
      user: {
        last_name: 'Pi',
        first_name: 'Co',
        email: 'user@username.com',
        username: 'copi'
      },
      access: 'edit'
    },
    {
      user: {
        last_name: 'Member',
        first_name: 'Team',
        email: 'user@username.com',
        username: 'teammember'
      },
      access: 'edit'
    }
  ],
  loading: false,
  error: null
};

export const projectsFixture = {
  listing: {
    projects: projectsListingFixture,
    loading: false,
    error: null
  },
  metadata: {
    title: '',
    description: '',
    projectId: '',
    members: [],
    loading: false,
    error: null
  }
};
