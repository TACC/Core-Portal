// Applications browser data
const applicationsFixture = {
  'Data Analysis': {
    jupyter: {
      specifications: [
        {
          type: 'html',
          displayName: 'TACC.cloud JupyterHub',
          html: '<h3>Jupyter HTML definition</h3>',
          available: true
        },
        {
          type: 'agave',
          displayName: 'HPC Jupyter on Frontera',
          name: 'hpc-jupyter-frontera',
          version: 'latest',
          revision: 'latest',
          available: true,
          lastRetrieved: '2020-10-02',
          id: 'hpc-jupyter-frontera-0.1u1'
        }
      ],
      description: 'Jupyter',
      icon: 'jupyter'
    }
  },
  Simulation: {
    matlab: {
      // Admin can specify apps
      specifications: [
        {
          type: 'agave',
          name: 'matlab-frontera',
          version: '9.5',
          revision: 'latest',
          // Dropdown display name
          displayName: 'Matlab on Frontera',
          available: true,
          // Retrieved (or cached) id
          id: 'matlab-frontera-9.5u7',
          // Should be cached in model, but if it's stale then we can
          // re-retrieve from Agave automatically or on admin demand
          lastRetrieved: '2020-10-02'
        },
        {
          type: 'agave',
          name: 'matlab-s2',
          version: 'latest',
          revision: 'latest',
          available: true,
          displayName: 'Matlab on Stampede2',
          id: 'matlab-s2-9.5u1'
        },
        {
          type: 'agave',
          name: 'matlab-ls5',
          version: '9.5',
          revision: '1',
          available: false,
          displayName: 'Matlab on LS5'
        }
      ],
      description: 'Matlab',
      icon: 'matlab'
    }
  },
  'My Private Applications': {
    'my-private-app': {
      type: 'agave',
      versions: ['my-private-app-0.1']
    }
  }
};
export default applicationsFixture;
