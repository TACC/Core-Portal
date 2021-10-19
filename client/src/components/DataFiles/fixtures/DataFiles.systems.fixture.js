const systemsFixture = {
  storage: {
    configuration: [
      {
        name: 'My Data (Work)',
        system: 'corral.home.username',
        scheme: 'private',
        api: 'tapis',
        icon: null,
      },
      {
        name: 'My Data (Frontera)',
        system: 'frontera.home.username',
        scheme: 'private',
        api: 'tapis',
        icon: null,
      },
      {
        name: 'My Data (Longhorn)',
        system: 'longhorn.home.username',
        scheme: 'private',
        api: 'tapis',
        icon: null,
      },
      {
        name: 'Community Data',
        system: 'cep.storage.community',
        scheme: 'community',
        api: 'tapis',
        icon: null,
      },
      {
        name: 'Public Data',
        system: 'cep.storage.public',
        scheme: 'public',
        api: 'tapis',
        icon: null,
      },
      {
        name: 'Shared Workspaces',
        scheme: 'projects',
        api: 'tapis',
        icon: null,
        hideSearchBar: false,
      },
      {
        name: 'Google Drive',
        system: 'googledrive',
        scheme: 'private',
        api: 'googledrive',
        icon: null,
      },
    ],
    error: false,
    errorMessage: null,
    loading: false,
    defaultHost: 'frontera.tacc.utexas.edu',
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
