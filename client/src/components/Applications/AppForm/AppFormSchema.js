import * as Yup from 'yup';
import {
  checkAndSetDefaultTargetPath,
  getTargetPathFieldName,
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

        const fieldName = param.key ?? param.name;
        const fieldLabel = param.notes?.label ?? fieldName;
        const field = {
          label: fieldLabel,
          description: param.description,
          required: param.inputMode === 'REQUIRED',
          readOnly: param.inputMode === 'FIXED',
          parameterSet: parameterSet,
        };

        if (param.notes?.enum_values) {
          field.type = 'select';
          field.options = param.notes?.enum_values;
          appFields.schema.parameterSet[parameterSet][fieldName] =
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
            appFields.schema.parameterSet[parameterSet][fieldName] =
              Yup.string().email('Must be a valid email.');
          } else if (param.notes?.fieldType === 'number') {
            field.type = 'number';
            appFields.schema.parameterSet[parameterSet][fieldName] =
              Yup.number();
          } else {
            field.type = 'text';
            appFields.schema.parameterSet[parameterSet][fieldName] =
              Yup.string();
          }
        }
        if (field.required) {
          appFields.schema.parameterSet[parameterSet][fieldName] =
            appFields.schema.parameterSet[parameterSet][fieldName].required(
              'Required'
            );
        }
        if (param.notes?.validator?.regex && param.notes?.validator?.message) {
          try {
            const regex = RegExp(param.notes.validator.regex);
            appFields.schema.parameterSet[parameterSet][fieldName] =
              appFields.schema.parameterSet[parameterSet][fieldName].matches(
                regex,
                param.notes.validator.message
              );
          } catch (SyntaxError) {
            console.warn('Invalid regex pattern for app');
          }
        }
        appFields.parameterSet[parameterSet][fieldName] = field;
        appFields.defaults.parameterSet[parameterSet][fieldName] =
          param.arg ?? param.value ?? '';
      });
    }
  );

  (app.definition.jobAttributes.fileInputs || []).forEach((i) => {
    const input = i;
    if (input.notes?.isHidden) {
      return;
    }

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
    // The default is to not show target path for file inputs.
    if (app.definition.notes?.showTargetPath || input.notes?.showTargetPath) {
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
        description:
          'The name of the ' +
          input.name +
          ' after it is copied to the target system, but before the job is run. Leave this value blank to just use the name of the input file.',
        required: false,
        readOnly: field.readOnly,
        type: 'text',
      };
      appFields.defaults.fileInputs[targetPathName] =
        checkAndSetDefaultTargetPath(input.targetPath);
    }
  });
  return appFields;
};

export default FormSchema;
