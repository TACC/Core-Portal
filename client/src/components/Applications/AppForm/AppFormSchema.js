import * as Yup from 'yup';
import {
  getTargetPathFieldName
} from './AppFormUtils';

const FormSchema = (app) => {
  const appFields = {
    parameterSet: {
      appArgs: {},
      containerArgs: {},
      schedulerOptions: {},
      envVariables: {},
    },
    fileInputs: {},
    defaults: {
      fileInputs: {},
      parameterSet: {
        appArgs: {},
        containerArgs: {},
        schedulerOptions: {},
        envVariables: {},
      },
    },
    schema: {
      fileInputs: {},
      parameterSet: {
        appArgs: {},
        containerArgs: {},
        schedulerOptions: {},
        envVariables: {},
      },
    },
  };

  Object.entries(app.definition.jobAttributes.parameterSet).forEach(
    ([parameterSet, parameterSetValue]) => {
      if (!Array.isArray(parameterSetValue)) return;

      parameterSetValue.forEach((param) => {
        if (param.notes?.isHidden) {
          return;
        }

        const field = {
          label: param.name ?? param.key,
          description: param.description,
          required: param.inputMode === 'REQUIRED',
          readOnly: param.inputMode === 'FIXED',
          parameterSet: parameterSet,
        };

        if (param.notes?.enum_values) {
          field.type = 'select';
          field.options = param.notes?.enum_values;
          appFields.schema.parameterSet[parameterSet][field.label] =
            Yup.string().oneOf(
              field.options.map((enumVal) => {
                if (typeof enumVal === 'string') {
                  return enumVal;
                }
                return Object.keys(enumVal)[0];
              })
            );
        } else {
          if (param.notes?.fieldType === 'email') {
            appFields.schema.parameterSet[parameterSet][field.label] =
              Yup.string().email('Must be a valid email.');
          } else if (param.notes?.fieldType === 'number') {
            field.type = 'number';
            appFields.schema.parameterSet[parameterSet][field.label] =
              Yup.number();
          } else {
            field.type = 'text';
            appFields.schema.parameterSet[parameterSet][field.label] =
              Yup.string();
          }
        }
        if (field.required) {
          appFields.schema.parameterSet[parameterSet][field.label] =
            appFields.schema.parameterSet[parameterSet][field.label].required(
              'Required'
            );
        }
        if (param.notes?.validator?.regex && param.notes?.validator?.message) {
          try {
            const regex = RegExp(param.notes.validator.regex);
            appFields.schema.parameterSet[parameterSet][field.label] =
              appFields.schema.parameterSet[parameterSet][field.label].matches(
                regex,
                param.notes.validator.message
              );
          } catch (SyntaxError) {
            console.warn('Invalid regex pattern for app');
          }
        }
        appFields.parameterSet[parameterSet][field.label] = field;
        appFields.defaults.parameterSet[parameterSet][field.label] =
          param.arg ?? param.value ?? '';
      });
    }
  );

  (app.definition.jobAttributes.fileInputs || []).forEach((i) => {
    const input = i;
    /* TODOv3 consider hidden file inputs https://jira.tacc.utexas.edu/browse/WP-102
      if (input.name.startsWith('_') || !input.value.visible) {  // TODOv3 visible or hidden
        return;
      }
      */
    const field = {
      label: input.name,
      description: input.description,
      required: input.inputMode === 'REQUIRED',
      readOnly: input.inputMode === 'FIXED',
    };

    field.type = 'text';

    appFields.schema.fileInputs[input.name] = Yup.string();
    appFields.schema.fileInputs[input.name] = appFields.schema.fileInputs[
      input.name
    ].matches(
      /^tapis:\/\//g,
      "Input file must be a valid Tapis URI, starting with 'tapis://'"
    );

    if (field.required) {
      appFields.schema.fileInputs[input.name] =
        appFields.schema.fileInputs[input.name].required('Required');
    }

    appFields.fileInputs[input.name] = field;
    appFields.defaults.fileInputs[input.name] =
      input.sourceUrl === null || typeof input.sourceUrl === 'undefined'
        ? ''
        : input.sourceUrl;
    
    // Add targetDir for all sourceUrl
    const targetPathName = getTargetPathFieldName(input.name);
    appFields.schema.fileInputs[targetPathName] = Yup.string();
    appFields.schema.fileInputs[targetPathName] = appFields.schema.fileInputs[
      targetPathName
    ].matches(
      /^tapis:\/\//g,
      "Input file Target Directory must be a valid Tapis URI, starting with 'tapis://'"
    );

    appFields.schema.fileInputs[targetPathName] = false;
    appFields.fileInputs[targetPathName] = {
      label: 'Target Path for ' + input.name,
      description: 'The target path is the location to which data are copied from the input. Empty target path or \'*\' indicates, the simple directory or file name from the input path is automatically assign to the target path.',
      required: false,
      readOnly: false,
      type: 'text'
    };
    appFields.defaults.fileInputs[targetPathName] =
      input.targetPath === null || typeof input.targetPath === 'undefined'
        ? '*'
        : input.targetPath;    
  });
  return appFields;
};

export default FormSchema;
