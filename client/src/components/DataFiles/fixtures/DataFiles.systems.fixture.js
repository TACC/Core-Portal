const systemsFixture = {
  defaultHost: 'frontera.tacc.utexas.edu',
  systemList: [
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
      api: 'tapis',
    }
  ]
};

export default systemsFixture;
