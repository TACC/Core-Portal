import * as Yup from 'yup';

const FormSchema = (app) => {
  const appFields = {
    appArgs: {},
    envVariables: {},
    fileInputs: {},
    defaults: { fileInputs: {}, appArgs: {} },
    schema: { fileInputs: {}, appArgs: {} },
  };
  /* TODOv3  envVariables */
  (app.definition.jobAttributes.parameterSet.appArgs || []).forEach((p) => {
    const param = p;
    // TODOv3 should we rename 'visible' to 'hidden' so that we default to showing argument
    if (!(param.notes.visible === undefined || param.notes.visible)) {
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
      field.type = 'text';
      appFields.schema.appArgs[param.name] = Yup.string();
      /* TODOv3 email. previously was:
       *   if (param.semantics.ontology.includes('email')) {
       *     field.type = 'email';
       *     appFields.schema.appArgs[param.name] = Yup.string().email(
       *        'Must be a valid email.'
       *      );
       *
       *  TODOv3 number. was this ever used? previously was:
       *       appFields.schema.appArgs[param.name] = Yup.number();
       *       field.type = 'number';
       *
       *  TODOV3 agaveFile was:
       *           field.agaveFile = param.semantics.ontology.includes('agaveFile');
       */
    }
    if (field.required) {
      appFields.schema.appArgs[param.name] =
        appFields.schema.appArgs[param.name].required('Required');
    }
    /* TODOv3
      if (param.value.validator) {
        appFields.schema.appArgs[param.name] = appFields.schema.appArgs[
          param.name
        ].matches(param.value.validator);
      }*/
    appFields.appArgs[param.name] = field;
    appFields.defaults.appArgs[param.name] =
      param.arg === null || typeof param.arg === 'undefined' ? '' : param.arg;
  });

  (app.definition.jobAttributes.fileInputs || []).forEach((i) => {
    const input = i;
    /* TODOv3 consider hidden file inputs
      if (input.name.startsWith('_') || !input.value.visible) {  // TODOv3 visible or hidden
        return;
      }
      */
    const field = {
      label: input.name,
      description: input.description,
      required: input.inputMode === 'REQUIRED ',
    };

    field.type = 'text';
    appFields.schema.fileInputs[input.name] = Yup.string();

    /* TODOv3 handle fileInput validation https://jira.tacc.utexas.edu/browse/TV3-91
    appFields.schema.fileInputs[input.name] = appFields.schema.fileInputs[
      input.name
    ].matches(
      /^tapis:\/\//g,
      "Input file must be a valid Tapis URI, starting with 'tapis://'"
    );
    */

    if (field.required) {
      appFields.schema.inputs[input.name] =
        appFields.schema.inputs[input.name].required('Required');
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
