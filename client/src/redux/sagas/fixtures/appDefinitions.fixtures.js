// Applications definitions
const appDefinitions = {
  'matlab-frontera-9.5u1': {
    definition: {},
    requirements: {
      host: 'frontera.tacc.utexas.edu',
      defaultQueue: 'normal',
      requiresLicense: 'matlab-f'
    }
  },
  'matlab-s2-9.5u1': {
    definition: {},
    requirements: {
      host: 'stampede2.tacc.utexas.edu',
      defaultQueue: 'skx-normal',
      requiresLicense: 'matlab-s2'
    }
  },
  'matlab-ls5-9.5u1': {
    definition: {},
    requirements: {
      host: 'ls5.tacc.utexas.edu',
      defaultQueue: 'normal',
      requiresLicense: 'matlab-ls5'
    }
  },
  'my-private-app-0.1': {
    definition: {},
    requirements: {
      host: 'stampede2.tacc.utexas.edu'
    },
    pems: {
      otheruser: 'READ_EXECUTE'
    }
  }
};
export default appDefinitions;
