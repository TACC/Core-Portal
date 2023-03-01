const systemsFixture = {
  storage: {
    configuration: [
      {
        name: 'My Data (Work)',
        system: 'cloud.data.community',
        scheme: 'private',
        api: 'tapis',
        homeDir: '/home/nathanf',
        icon: null,
        keyservice: true,
        default: true,
      },
      {
        name: 'My Data (Frontera)',
        system: 'frontera',
        scheme: 'private',
        api: 'tapis',
        homeDir: '/home1/05724/nathanf',
        icon: null,
      },
      {
        name: 'Community Data',
        system: 'cloud.data.community',
        scheme: 'community',
        api: 'tapis',
        homeDir: '/corral/tacc/aci/CEP/community',
        icon: null,
        siteSearchPriority: 1,
      },
      {
        name: 'Public Data',
        system: 'cloud.data.community',
        scheme: 'public',
        api: 'tapis',
        homeDir: '/corral/tacc/aci/CEP/public',
        icon: 'publications',
        siteSearchPriority: 0,
      },
      {
        name: 'Shared Workspaces',
        scheme: 'projects',
        api: 'tapis',
        icon: 'publications',
      },
      {
        name: 'Google Drive',
        system: 'googledrive',
        scheme: 'private',
        api: 'googledrive',
        icon: null,
        integration: 'portal.apps.googledrive_integration',
      },
    ],
    error: false,
    errorMessage: null,
    loading: false,
    defaultHost: 'cloud.data.tacc.utexas.edu',
    defaultSystem: 'cloud.data.community',
  },
  definitions: {
    list: [
      {
        id: 'frontera.home.username',
        storage: {
          host: 'frontera.tacc.utexas.edu',
          rootDir: '/home1/012345/username',
        },
      },
      {
        id: 'longhorn.home.username',
        storage: {
          host: 'longhorn.tacc.utexas.edu',
          rootDir: '/home/012345/username',
        },
      },
    ],
    error: false,
    errorMessage: null,
    loading: false,
  },
};

export default systemsFixture;
