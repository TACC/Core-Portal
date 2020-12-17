const systemsFixture = {
  defaultHost: 'frontera.tacc.utexas.edu',
  systemList: [
    {
      name: 'My Data (Frontera)',
      system: 'frontera.home.username',
      scheme: 'private',
      api: 'tapis',
      definition: {
        storage: {
          host: 'frontera.tacc.utexas.edu',
          rootDir: '/home1/012345/username'
        }
      }
    },
    {
      name: 'My Data (Longhorn)',
      system: 'longhorn.home.username',
      scheme: 'private',
      api: 'tapis',
      definition: {
        storage: {
          host: 'longhorn.tacc.utexas.edu',
          rootDir: '/home/012345/username'
        }
      }
    }
  ]
};

export default systemsFixture;
