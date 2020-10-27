// Applications browser data
const applicationsFixture = {
  'Data Processing': {
    jupyter: {
      specifications: [
        {
          type: 'html',
          displayName: 'TACC.cloud JupyterHub',
          html:
            '<div class="jumbotron text-center"> <h2>Jupyter Notebook</h2> <p> The Jupyter Notebook is a web application that allows you to create and share documents that contain live code, equations, visualizations and explanatory text. Uses include: data cleaning and transformation, numerical simulation, statistical modeling, machine learning and <a target="_blank" href="http://jupyter.org/">much more</a>. </p><p><a class="btn btn-lg btn-primary" href="https://jupyter.tacc.cloud" target="_blank">Launch</a></p><p><b>NOTE:</b> This Jupyter instance will terminate after being idle for 3 days.</p></div>',
          available: true,
          id: 'uid-abcd1234'
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
  Visualization: {
    'TACC Visualization Portal': {
      specifications: [
        {
          type: 'html',
          html:
            '<div class="jumbotron text-center"> <h2>TACC Visualization Portal</h2> <p> The TACC Visualization Portal allows simple access to TACC\'s vis resources, including remote, interactive web-based access to Stampede2, Frontera, and Wrangler. Launch iPython, Jupyter, and R Studio sessions and more.</p><p><a class="btn btn-lg btn-primary" href="https://vis.tacc.utexas.edu/" target="_blank">Launch</a></p></div>',
          displayName: 'TACC Visualization Portal',
          available: true,
          id: 'uid-1234abcd'
        }
      ],
      description: 'TACC Visualization Portal',
      icon: 'vis-portal'
    }
  },
  'My Apps': {
    'my-private-app': {
      type: 'agave',
      versions: ['my-private-app-0.1']
    }
  }
};
export default applicationsFixture;
