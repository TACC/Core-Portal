export const appTrayFixture = {
  tabs: [
    {
      title: 'My Apps',
      apps: [
        {
          label: 'Array Test',
          version: '0.1',
          description: 'Test arrays of inputs',
          type: 'tapis',
          appId: 'arraytest-0.1',
        },
      ],
    },
    {
      title: 'Simulation',
      apps: [
        {
          label: 'NAMD',
          icon: '',
          version: '2.1.3',
          type: 'tapis',
          appId: 'namd-frontera-2.1.3u2',
        },
      ],
    },
    {
      title: 'Data Processing',
      apps: [
        {
          label: 'Frontera HPC Jupyter',
          icon: 'jupyter',
          version: '1.0',
          type: 'tapis',
          appId: 'frontera-hpc-jupyter-1.0u11',
        },
        {
          label: 'MATLAB R2018b',
          icon: 'matlab',
          version: '9.5',
          type: 'tapis',
          appId: 'matlab-9.5u7',
        },
        {
          label: 'Rstudio',
          icon: '',
          version: '1.1.423',
          type: 'tapis',
          appId: 'RStudio-S2-1.1.423u1',
        },
      ],
    },
    {
      title: 'Visualization',
      apps: [
        {
          label: 'TACC Visualization Portal',
          icon: 'vis-portal',
          version: '1.0',
          type: 'html',
          appId: 'vis-portal',
        },
      ],
    },
  ],
  htmlDefinitions: {
    'vis-portal': {
      appType: 'html',
      html: '<div class="jumbotron text-center"> <h2>TACC Visualization Portal</h2> <p> The TACC Visualization Portal allows simple access to TACC\'s vis resources, including remote, interactive web-based access to Stampede2, Frontera, and Wrangler. Launch iPython, Jupyter, and R Studio sessions and more.</p><p><a class="btn btn-lg btn-primary" href="https://vis.tacc.utexas.edu/" target="_blank">Launch</a></p></div>',
      appId: 'vis-portal',
      label: 'TACC Visualization Portal',
      description: 'TACC Visualization Portal',
    },
  },
};

export const appTrayExpectedFixture = {
  categoryDict: {
    'My Apps': [
      {
        label: 'Array Test',
        version: '0.1',
        description: 'Test arrays of inputs',
        type: 'tapis',
        appId: 'arraytest-0.1',
      },
    ],
    Simulation: [
      {
        label: 'NAMD',
        icon: '',
        version: '2.1.3',
        type: 'tapis',
        appId: 'namd-frontera-2.1.3u2',
      },
    ],
    'Data Processing': [
      {
        label: 'Frontera HPC Jupyter',
        icon: 'jupyter',
        version: '1.0',
        type: 'tapis',
        appId: 'frontera-hpc-jupyter-1.0u11',
      },
      {
        label: 'MATLAB R2018b',
        icon: 'matlab',
        version: '9.5',
        type: 'tapis',
        appId: 'matlab-9.5u7',
      },
      {
        label: 'Rstudio',
        icon: '',
        version: '1.1.423',
        type: 'tapis',
        appId: 'RStudio-S2-1.1.423u1',
      },
    ],
    Visualization: [
      {
        label: 'TACC Visualization Portal',
        icon: 'vis-portal',
        version: '1.0',
        type: 'html',
        appId: 'vis-portal',
      },
    ],
  },
  htmlDict: {
    'vis-portal': {
      appType: 'html',
      html: '<div class="jumbotron text-center"> <h2>TACC Visualization Portal</h2> <p> The TACC Visualization Portal allows simple access to TACC\'s vis resources, including remote, interactive web-based access to Stampede2, Frontera, and Wrangler. Launch iPython, Jupyter, and R Studio sessions and more.</p><p><a class="btn btn-lg btn-primary" href="https://vis.tacc.utexas.edu/" target="_blank">Launch</a></p></div>',
      appId: 'vis-portal',
      label: 'TACC Visualization Portal',
      description: 'TACC Visualization Portal',
    },
  },
  appIcons: {
    'frontera-hpc-jupyter-1.0u11': 'jupyter',
    'matlab-9.5u7': 'matlab',
    'vis-portal': 'vis-portal',
  },
  error: {
    isError: false,
  },
  loading: false,
  defaultTab: '',
};
