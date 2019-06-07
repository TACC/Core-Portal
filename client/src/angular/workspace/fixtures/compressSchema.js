const compressSchema = {
    type: 'object',
    properties: {
        parameters: {
            type: 'object',
            properties: {
                compression_type: {
                    title: 'Compression Type',
                    description: 'Select the type of compressed file, either a Gzipped TAR file (.tar.gz) or a Zip file (.zip).',
                    required: true,
                    default: 'tgz',
                    pattern: undefined,
                    type: 'string',
                    enum: [
                        'tgz',
                        'zip',
                    ],
                    'x-schema-form': {
                        titleMap: [
                            {
                                value: 'tgz',
                                name: 'tar.gz',
                            },
                            {
                                value: 'zip',
                                name: 'zip',
                            },
                        ],
                    },
                },
            },
        },
        inputs: {
            type: 'object',
            properties: {
                workingDirectory: {
                    title: 'Target Path to be Compressed',
                    description: 'The directory or file to be compressed.',
                    id: 'workingDirectory',
                    default: 'agave://cep.storage.default/',
                    type: 'string',
                    format: 'agaveFile',
                    required: true,
                },
            },
        },
        allocation: {
            default: 'A-ccsc',
            title: 'Allocation',
            description: 'Select the project allocation you would like to use with this job submission.',
            type: 'string',
            required: true,
            enum: [
                'A-ccsc',
                'SD2E-Community',
                'TACC-ACI',
            ],
        },
        maxRunTime: {
            default: '02:00:00',
            title: 'Maximum job runtime',
            description: 'In HH:MM:SS format. The maximum time you expect this job to run for. After this amount of time your job will be killed by the job scheduler. Shorter run times result in shorter queue wait times. Maximum possible time is 48:00:00 (48 hours).',
            type: 'string',
            pattern: '^(48:00:00)|([0-4][0-9]:[0-5][0-9]:[0-5][0-9])$',
            validationMessage: 'Must be in format HH:MM:SS and be less than 48 hours (48:00:00).',
            required: true,
            'x-schema-form': {
                placeholder: '02:00:00',
            },
        },
        name: {
            title: 'Job name',
            description: 'A recognizable name for this job.',
            type: 'string',
            required: true,
            default: 'compress-0.1u3_2019-01-01T00:00:00',
            maxLength: 64,
        },
        archivePath: {
            title: 'Job output archive location (optional)',
            description: 'Specify a location where the job output should be archived. By default, job output will be archived at: <code>archive/jobs/${YYYY-MM-DD}/${JOB_NAME}-${JOB_ID}</code>.',
            type: 'string',
            format: 'agaveFile',
            id: 'archivePath',
            'x-schema-form': {
                placeholder: 'archive/jobs/${YYYY-MM-DD}/${JOB_NAME}-${JOB_ID}',
            },
        },
        nodeCount: {
            title: 'Node Count',
            description: 'Number of requested process nodes for the job. Default number of nodes is 1.',
            type: 'integer',
            default: 1,
            minimum: 1,
            maximum: undefined,
        },

        processorsPerNode: {
            title: 'Processors Per Node',
            description: `Number of processors (cores) per node for the job. e.g. A selection of 16 processors per node along with 4 nodes
            will result in 16 processors on 4 nodes, with 64 processors total. Default number of processors per node is 1.`,
            type: 'integer',
            default: 1,
            minimum: 1,
            maximum: 1,
        },
    },
};

export { compressSchema };
