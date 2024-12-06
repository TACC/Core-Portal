const dataFilesAllocations = {
    hosts: {
        'ls6.tacc.utexas.edu': ['TACC-ACI'],
        'data.tacc.utexas.edu': ['TACC-ACI'],
        'ranch.tacc.utexas.edu': ['TACC-ACI'],
        'stampede2.tacc.utexas.edu': ['TACC-ACI'],
        'maverick2.tacc.utexas.edu': ['TACC-ACI'],
        'frontera.tacc.utexas.edu': ['TACC-ACI'],
    },
    portal_alloc: 'TACC-ACI',
    active: [
        {
            title: 'TACC-ACI',
            projectId: 9192,
            projectName: 'TACC-ACI',
            systems: [
            {
                name: 'ls6',
                host: 'ls6.tacc.utexas.edu',
            },
            {
                name: 'frontera',
                host: 'frontera.tacc.utexas.edu',
            },
            ],
        },
    ],
};

export default dataFilesAllocations;