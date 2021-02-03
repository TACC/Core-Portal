const systemsFixture = {
  storage: {
    defaultHost: 'frontera.tacc.utexas.edu',
    configuration: [
      {
        name: 'My Data (Frontera)',
        system: 'frontera.home.username',
        scheme: 'private',
        api: 'tapis'
      },
      {
        name: 'My Data (Longhorn)',
        system: 'longhorn.home.username',
        scheme: 'private',
        api: 'tapis'
      },
      {
        name: 'Shared Workspaces',
        scheme: 'projects',
        api: 'tapis'
      }
    ],
    error: false,
    errorMessage: null,
    loading: false
  },
  definitions: {
    list: [
      {
        id: 'frontera.home.username',
        storage: {
          host: 'frontera.tacc.utexas.edu',
          rootDir: '/home1/012345/username'
        }
      },
      {
        id: 'longhorn.home.username',
        storage: {
          host: 'longhorn.tacc.utexas.edu',
          rootDir: '/home/012345/username'
        }
      }
    ],
    error: false,
    errorMessage: null,
    loading: true
  },
  systemList: [
    {
      name: 'My Data (Frontera)',
      system: 'frontera.home.username',
      scheme: 'private',
      api: 'tapis'
    }
  ]
};

export default systemsFixture;
