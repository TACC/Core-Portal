import _ from 'underscore';

class Apps {
    constructor ($http, $q, $translate) {
        'ngInject';
        this.$http = $http;
        this.$q = $q;
        this.$translate = $translate;
    }
    
    list (query) {
        return this.$http({
            url: '/api/workspace/meta',
            method: 'GET',
            params: { q: query },
            cache: true
        });
    }

    get (app_id) {
        return this.$http({
            url: '/api/workspace/apps',
            method: 'GET',
            params: { app_id: app_id }
        });
    }

    getMeta (app_id) {
        return this.$http({
            url: '/api/workspace/meta',
            method: 'GET',
            params: { app_id: app_id }
        });
    }

    getPublic() {
        return this.$http({
            url: '/api/workspace/apps',
            method: 'GET',
            params: { publicOnly: true }
        });
    }

    formSchema (app) {
    /**
     * Generate a JSON.schema for the app ready for angular-schema-form
     * https://github.com/json-schema-form/angular-schema-form
     */
        let params = app.parameters || [],
            inputs = app.inputs || [],
            schema = {
                type: 'object',
                properties: {}
            };

        if (params.length > 0) {
            schema.properties.parameters = {
                type: 'object',
                properties: {}
            };
            _.each(params, (param)=> {
                if (!param.value.visible) {
                    return;
                }
                if (param.id.startsWith('_')) {
                    return;
                }
                var field = {
                    title: param.details.label,
                    description: param.details.description,
                    required: param.value.required,
                    default: param.value.default
                };
                switch (param.value.type) {
                    case 'bool':
                    case 'flag':
                        field.type = 'boolean';
                        break;

                    case 'enumeration':
                        field.type = 'string';
                        field.enum = _.map(param.value.enum_values, function(enum_val) {
                            return Object.keys(enum_val)[0];
                        });
                        field['x-schema-form'] = {
                            titleMap: _.map(param.value.enum_values, function(enum_val) {
                                var key = Object.keys(enum_val)[0];
                                return {
                                    value: key,
                                    name: enum_val[key]
                                };
                            })
                        };
                        break;

                    case 'number':
                        field.type = 'number';
                        break;

                    case 'string':
                    default:
                        field.type = 'string';
                }
                schema.properties.parameters.properties[param.id] = field;
            });
        }

        if (inputs.length > 0) {
            schema.properties.inputs = {
                type: 'object',
                properties: {},
            };
            _.each(inputs, (input) => {
                if (!input.value.visible) {
                    return;
                }
                if (input.id.startsWith('_')) {
                    return;
                }
                let field = {
                    title: input.details.label,
                    description: input.details.description,
                    id: input.id,
                    default: input.value.default,
                };
                if (input.semantics.maxCardinality === 1) {
                    field.type = 'string';
                    field.format = 'agaveFile';
                    field.required = input.value.required;
                } else {
                    field.type = 'array';
                    field.items = {
                        type: 'string',
                        format: 'agaveFile',
                        required: input.value.required,
                        'x-schema-form': { notitle: true },
                    };
                    if (input.semantics.maxCardinality > 1) {
                        field.maxItems = input.semantics.maxCardinality;
                    }
                }
                schema.properties.inputs.properties[input.id] = field;
            });
        }

        schema.properties.allocation = {
            default: app.portal_alloc ? app.portal_alloc : app.allocations[0],
            title: 'Allocation',
            description: 'Select the project allocation you would like to use with this job submission.',
            type: 'string',
            required: true,
            enum: app.allocations.sort(),
        };

        schema.properties.maxRunTime = {
            default: app.defaultMaxRunTime || '06:00:00',
            title: 'Maximum job runtime',
            description: 'In HH:MM:SS format. The maximum time you expect this job to run for. After this amount of time your job will be killed by the job scheduler. Shorter run times result in shorter queue wait times. Maximum possible time is 48:00:00 (48 hours).',
            type: 'string',
            pattern:'^(48:00:00)|([0-4][0-9]:[0-5][0-9]:[0-5][0-9])$',
            validationMessage:'Must be in format HH:MM:SS and be less than 48 hours (48:00:00)',
            required: true,
            'x-schema-form': { placeholder: app.defaultMaxRunTime }
        };

        schema.properties.name = {
            title: 'Job name',
            description: 'A recognizable name for this job',
            type: 'string',
            required: true,
            default: app.id + '_' + new Date().toISOString(),
            maxLength: 64
        };

        schema.properties.archivePath = {
            title: 'Job output archive location (optional)',
            description: 'Specify a location where the job output should be archived. By default, job output will be archived at: <code>archive/jobs/${YYYY-MM-DD}/${JOB_NAME}-${JOB_ID}</code>.',
            type: 'string',
            format: 'agaveFile',
            id: 'archivePath',
            'x-schema-form': { placeholder: 'archive/jobs/${YYYY-MM-DD}/${JOB_NAME}-${JOB_ID}' }
        };
        return schema;
    }

}

export default Apps;
