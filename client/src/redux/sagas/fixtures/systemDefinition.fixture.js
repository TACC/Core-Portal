const systemDefinitionFixture = {
  owner: 'wma_prtl',
  _links: {
    owner: { href: 'https://portals-api.tacc.utexas.edu/profiles/v2/wma_prtl' },
    metadata: {
      href:
        'https://portals-api.tacc.utexas.edu/meta/v2/data/?q=%7B%22associationIds%22%3A%221843722814843916777-242ac119-0001-006%22%7D'
    },
    roles: {
      href:
        'https://portals-api.tacc.utexas.edu/systems/v2/frontera.home.user/roles'
    },
    self: {
      href: 'https://portals-api.tacc.utexas.edu/systems/v2/frontera.home.user'
    }
  },
  available: true,
  description: 'Home system for user: user',
  storage: {
    proxy: null,
    protocol: 'SFTP',
    mirror: false,
    port: 22,
    auth: { type: 'SSHKEYS' },
    publicAppsDir: null,
    host: 'frontera.tacc.utexas.edu',
    rootDir: '/home1/12345/user',
    homeDir: '/'
  },
  type: 'STORAGE',
  uuid: '1843722814843916777-242ac119-0001-006',
  revision: 2,
  site: 'portal.dev',
  default: false,
  public: false,
  globalDefault: false,
  name: 'frontera.home.user',
  id: 'frontera.home.user',
  lastModified: '2020-08-11T14:37:39-05:00',
  status: 'UP'
};

export default systemDefinitionFixture;
