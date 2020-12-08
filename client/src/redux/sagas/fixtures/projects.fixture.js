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
    name: 'FRONTERA-3',
    id: 'test.site.project.FRONTERA-3',
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
    absolutePath: '/corral-repl/tacc/aci/CEP/projects/FRONTERA-3'
  }
];

export const projectDefFixture = {
  title: 'My Project',
  members: [
    {
      user: {
        username: 'username',
        first_name: 'User',
        last_name: 'Name',
        email: 'user@username.com'
      },
      access: 'owner'
    }
  ]
};

export const projectsFixture = {
  listing: {
    projects: projectsListingFixture,
    loading: false,
    error: null
  },
  project: {
    title: '',
    members: []
  }
};
