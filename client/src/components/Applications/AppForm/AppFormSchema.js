import * as Yup from 'yup';

const FormSchema = (app) => {
  const appFields = {
    appArgs: {},
    envVariables: {},
    fileInputs: {},
    defaults: { fileInputs: {}, appArgs: {} },
    schema: { fileInputs: {}, appArgs: {} },
  };
  /* TODOv3: handle envVariables  https://jira.tacc.utexas.edu/browse/WP-83 */
  (app.definition.jobAttributes.parameterSet.appArgs || []).forEach((p) => {
    const param = p;
    if (param.notes.isHidden) {
      return;
    }

    const field = {
      label: param.name,
      description: param.description,
      required: param.inputMode === 'REQUIRED',
    };

    if (param.notes.enum_values) {
      field.type = 'select';
      field.options = param.notes.enum_values;
      appFields.schema.appArgs[param.name] = Yup.string().oneOf(
        field.options.map((enumVal) => {
          if (typeof enumVal === 'string') {
            return enumVal;
          }
          return Object.keys(enumVal)[0];
        })
      );
    } else {
      if (p.notes.fieldType === 'email') {
        appFields.schema.appArgs[param.name] = Yup.string().email(
          'Must be a valid email.'
        );
      } else if (p.notes.fieldType === 'number') {
        field.type = 'number';
        appFields.schema.appArgs[param.name] = Yup.number();
      } else {
        field.type = 'text';
        appFields.schema.appArgs[param.name] = Yup.string();
      }
    }
    if (field.required) {
      appFields.schema.appArgs[param.name] =
        appFields.schema.appArgs[param.name].required('Required');
    }
    appFields.appArgs[param.name] = field;
    appFields.defaults.appArgs[param.name] =
      param.arg === null || typeof param.arg === 'undefined' ? '' : param.arg;
  });

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
  });
  return appFields;
};

export default FormSchema;
