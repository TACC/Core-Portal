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
    if (
      !(param.notes.visible === undefined || param.notes.visible) ||
      param.name.startsWith('_')
    ) {
      // TODOv3 should we rename 'visible' to 'hidden' so that we default to showing argument
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

    field.type = 'text'; /* TODOv3 consider cardinality
    if (input.semantics.maxCardinality === 1) {
      field.type = 'text';
    } else {
      field.type = 'array';
      field.maxItems = input.semantics.maxCardinality;
    }
    */
    appFields.schema.fileInputs[input.name] = Yup.string();

    // TODOv3 consider validation
    appFields.schema.fileInputs[input.name] = appFields.schema.fileInputs[
      input.name
    ].matches(
      /^tapis:\/\//g,
      "Input file must be a valid Tapis URI, starting with 'tapis://'"
    );

    if (field.required) {
      appFields.schema.inputs[input.name] =
        appFields.schema.inputs[input.name].required('Required');
    }
    /* TODOv3 as above we need additional metadata to determine if its required or validation
      if (input.value.validator) {
        appFields.schema.inputs[input.name] = appFields.schema.inputs[
          input.name
        ].matches(input.value.validator);
      } else {
        appFields.schema.inputs[input.name] = appFields.schema.inputs[
          input.name
        ].matches(
          /^tapis:\/\//g,
          "Input file must be a valid Tapis URI, starting with 'tapis://'"
        );
      }
       */

    appFields.fileInputs[input.name] = field;

    // TODOv3  check defaults. I don't think there is a default for files (just not posting with the param?) but using sourceUrl as a default (?)
    appFields.defaults.fileInputs[input.name] =
      input.sourceUrl === null || typeof input.sourceUrl === 'undefined'
        ? ''
        : input.sourceUrl;
  });
  return appFields;
};

export default FormSchema;
