/* TODOv3 update this fixture https://jira.tacc.utexas.edu/browse/WP-68*/

const systemsFixture = {
  storage: {
    configuration: [
      {
        name: 'My Data (Work)',
        system: 'corral.home.username',
        scheme: 'private',
        api: 'tapis',
        icon: null,
        hidden: true,
        homeDir: '/home/username',
        default: true,
        keyservice: true,
      },
      {
        name: 'My Data (Frontera)',
        system: 'frontera.home.username',
        scheme: 'private',
        api: 'tapis',
        icon: null,
        homeDir: '/home/username',
      },
      {
        name: 'My Data (Longhorn)',
        system: 'longhorn.home.username',
        scheme: 'private',
        api: 'tapis',
        icon: null,
        homeDir: '/home/username',
      },
      {
        name: 'Community Data',
        system: 'cep.storage.community',
        scheme: 'community',
        api: 'tapis',
        icon: null,
        siteSearchPriority: 1,
        homeDir: '/corral/tacc/aci/CEP/community',
      },
      {
        name: 'Public Data',
        system: 'cep.storage.public',
        scheme: 'public',
        api: 'tapis',
        icon: 'publications',
        siteSearchPriority: 0,
        homeDir: '/corral/tacc/aci/CEP/public',
      },
      {
        name: 'Shared Workspaces',
        scheme: 'projects',
        api: 'tapis',
        icon: null,
        readOnly: false,
        hideSearchBar: false,
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
    defaultHost: 'frontera.tacc.utexas.edu',
    defaultSystem: 'frontera',
  },
  definitions: {
    list: [
      {
        id: 'frontera.home.username',
        storage: {
          host: 'frontera.tacc.utexas.edu',
          rootDir: '/home1/012345/username',
        },
        effectiveUserId: 'username',
      },
      {
        id: 'longhorn.home.username',
        storage: {
          host: 'longhorn.tacc.utexas.edu',
          rootDir: '/home/012345/username',
        },
        effectiveUserId: 'username',
      },
    ],
    error: false,
    errorMessage: null,
    loading: false,
  },
};

export default systemsFixture;
