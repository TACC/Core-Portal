const systemsFixture = {
  storage: {
    configuration: [
      {
        name: 'My Data (Work)',
        system: 'corral.home.username',
        scheme: 'private',
        api: 'tapis',
        icon: null
      },
      {
        name: 'My Data (Frontera)',
        system: 'frontera.home.username',
        scheme: 'private',
        api: 'tapis',
        icon: null
      },
      {
        name: 'My Data (Longhorn)',
        system: 'longhorn.home.username',
        scheme: 'private',
        api: 'tapis',
        icon: null
      },
      {
        name: 'Community Data',
        system: 'cep.storage.community',
        scheme: 'community',
        api: 'tapis',
        icon: null
      },
      {
        name: 'Public Data',
        system: 'cep.storage.public',
        scheme: 'public',
        api: 'tapis',
        icon: null
      },
      {
        name: 'Shared Workspaces',
        scheme: 'projects',
        api: 'tapis',
        icon: null
      },
      {
        name: 'Google Drive',
        system: 'googledrive',
        scheme: 'private',
        api: 'googledrive',
        icon: null
      }
    ],
    error: false,
    errorMessage: null,
    loading: false,
    defaultHost: 'frontera.tacc.utexas.edu'
  },
  definitions: {
    list: [
      {
        owner: 'wma_prtl',
        _links: {
          metadata: {
            href:
              'https://portals-api.tacc.utexas.edu/meta/v2/data/?q=%7B%22associationIds%22%3A%226239522116455886359-242ac113-0001-006%22%7D'
          },
          roles: {
            href:
              'https://portals-api.tacc.utexas.edu/systems/v2/cep.storage.public/roles'
          },
          self: {
            href:
              'https://portals-api.tacc.utexas.edu/systems/v2/cep.storage.public'
          }
        },
        available: true,
        description: 'CEP public data system',
        storage: {
          proxy: null,
          protocol: 'SFTP',
          mirror: false,
          port: 22,
          auth: {
            type: 'SSHKEYS'
          },
          publicAppsDir: null,
          host: 'data.tacc.utexas.edu',
          rootDir: '/corral-repl/tacc/aci/CEP/public',
          homeDir: '/'
        },
        type: 'STORAGE',
        uuid: '6239522116455886359-242ac113-0001-006',
        revision: 2,
        site: 'portal.dev',
        default: false,
        public: true,
        globalDefault: false,
        name: 'cep.storage.public',
        id: 'cep.storage.public',
        lastModified: '2019-06-28T14:50:24-05:00',
        status: 'UP'
      },
      {
        owner: 'wma_prtl',
        _links: {
          owner: {
            href: 'https://portals-api.tacc.utexas.edu/profiles/v2/wma_prtl'
          },
          metadata: {
            href:
              'https://portals-api.tacc.utexas.edu/meta/v2/data/?q=%7B%22associationIds%22%3A%224422418841996825067-242ac114-0001-006%22%7D'
          },
          roles: {
            href:
              'https://portals-api.tacc.utexas.edu/systems/v2/corral.home.username/roles'
          },
          self: {
            href:
              'https://portals-api.tacc.utexas.edu/systems/v2/corral.home.username'
          }
        },
        available: true,
        description: 'Home system for user: username',
        storage: {
          proxy: null,
          protocol: 'SFTP',
          mirror: false,
          port: 22,
          auth: {
            type: 'SSHKEYS'
          },
          publicAppsDir: null,
          host: 'data.tacc.utexas.edu',
          rootDir: '/work/05089/username',
          homeDir: '/'
        },
        type: 'STORAGE',
        uuid: '4422418841996825067-242ac114-0001-006',
        revision: 1,
        site: 'portal.dev',
        default: false,
        public: false,
        globalDefault: false,
        name: 'corral.home.username',
        id: 'corral.home.username',
        lastModified: '2021-04-08T16:35:26-05:00',
        status: 'UP'
      }
    ],
    error: false,
    errorMessage: null,
    loading: false
  }
};

export default systemsFixture;
