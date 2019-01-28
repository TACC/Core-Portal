const agaveApp = {
    defaultMemoryPerNode: 1,
    owner: 'dbryce',
    defaultQueue: null,
    id: 'xplan-0.1.0u1',
    uuid: '4067809291888160280-242ac115-0001-005',
    parameters: [],
    shortDescription: 'xplan',
    defaultNodeCount: 1,
    label: 'xplan',
    defaultProcessorsPerNode: 1,
    version: '0.1.0',
    _links: {
        self: {
            href: 'https://api.sd2e.org/apps/v2/xplan-0.1.0u1'
        },
        storageSystem: {
            href: 'https://api.sd2e.org/systems/v2/data-sd2e-projects-users'
        },
        executionSystem: {
            href: 'https://api.sd2e.org/systems/v2/hpc-tacc-maverick'
        },
        owner: {
            href: 'https://api.sd2e.org/profiles/v2/dbryce'
        },
        permissions: {
            href: 'https://api.sd2e.org/apps/v2/xplan-0.1.0u1/pems'
        },
        history: {
            href: 'https://api.sd2e.org/apps/v2/xplan-0.1.0u1/history'
        },
        metadata: {
            href: 'https://api.sd2e.org/meta/v2/data/?q=%7B%22associationIds%22%3A%224067809291888160280-242ac115-0001-005%22%7D'
        }
    },
    templatePath: 'runner-template.sh',
    defaultMaxRunTime: null,
    revision: 1,
    available: true,
    inputs: [
        {
            semantics: {
                fileTypes: [],
                minCardinality: 1,
                ontology: [
                    'http://edamontology.org/format_1929'
                ],
                maxCardinality: 1
            },
            id: 'problem',
            value: {
                enquote: false,
                visible: true,
                validator: null,
                default: '',
                required: true,
                order: 0
            },
            details: {
                argument: null,
                repeatArgument: false,
                description: 'Problem definition file',
                showArgument: false,
                label: 'problem'
            }
        }
    ],
    tags: [
        'xplan',
        'XPLAN',
        'sift',
        'SIFT'
    ],
    outputs: [],
    isPublic: true,
    longDescription: null,
    executionSystem: 'hpc-tacc-maverick',
    testPath: 'tester.sh',
    ontology: [],
    deploymentPath: '/.public-apps/xplan-0.1.0u1.zip',
    icon: null,
    deploymentSystem: 'data-sd2e-projects-users',
    name: 'xplan',
    license: {
        type: null
    },
    checkpointable: false,
    lastModified: '2018-05-03T12:45:34-05:00',
    modules: [
        'load tacc-singularity/2.3.1'
    ],
    executionType: 'HPC',
    parallelism: 'SERIAL',
    helpURI: null
};

export { agaveApp };
