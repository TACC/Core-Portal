import * as Yup from 'yup';

const FormSchema = (app) => {
  const appFields = {
    parameterSet: {},
    fileInputs: {},
    defaults: { fileInputs: {}, parameterSet: {} },
    schema: { fileInputs: {}, parameterSet: {} },
  };

  /* TODOv3  app.definition.jobAttributes
  (app.definition.parameterSet || []).forEach((p) => {
    const param = p;
    if (!param.value.visible || param.id.startsWith('_')) {
      return;
    }
    try {
      RegExp(param.value.validator);
    } catch (e) {
      param.value.validator = null;
    }

    const field = {
      label: param.details.label,
      description: param.details.description,
      required: param.value.required,
    };

    switch (param.value.type) {
      case 'bool':
      case 'flag':
        field.type = 'checkbox';
        field.checked = param.value.default || false;
        appFields.schema.parameterSet[param.id] = Yup.boolean();
        break;

      case 'enumeration':
        field.type = 'select';
        field.options = param.value.enum_values;
        appFields.schema.parameterSet[param.id] = Yup.string().oneOf(
          field.options.map((enumVal) => {
            if (typeof enumVal === 'string') {
              return enumVal;
            }
            return Object.keys(enumVal)[0];
          })
        );
        break;

      case 'number':
        appFields.schema.parameterSet[param.id] = Yup.number();
        field.type = 'number';
        break;

      case 'string':
        field.agaveFile = param.semantics.ontology.includes('agaveFile');
        if (param.semantics.ontology.includes('email')) {
          field.type = 'email';
          appFields.schema.parameterSet[param.id] = Yup.string().email(
            'Must be a valid email.'
          );
        } else {
          field.type = 'text';
          appFields.schema.parameterSet[param.id] = Yup.string();
        }
        break;
      default:
        appFields.schema.parameterSet[param.id] = Yup.string();
        field.type = 'text';
    }

    if (param.value.required) {
      appFields.schema.parameterSet[param.id] =
        appFields.schema.parameterSet[param.id].required('Required');
    }
    if (param.value.validator) {
      appFields.schema.parameterSet[param.id] = appFields.schema.parameterSet[
        param.id
      ].matches(param.value.validator);
    }
    appFields.parameterSet[param.id] = field;
    appFields.defaults.parameterSet[param.id] =
      param.value.default === null || typeof param.value.default === 'undefined'
        ? ''
        : param.value.default;
  });
  */

  (app.definition.jobAttributes.fileInputs || []).forEach((i) => {
    const input = i;
    /* TODOv3 consider hidden file inputs
    if (input.name.startsWith('_') || !input.value.visible) {  // TODOv3 visible or hidden
      return;
    }
    */
    /* TODOv3 consider validation
    try {
      RegExp(input.value.validator);
    } catch (e) {
      input.value.validator = null;
    }
     */
    const field = {
      label: input.name,
      description:
        ' ' /* TODOv3 consider file description.  previously this was: input.details.description */,
      required: input.inputMode === 'REQUIRED ', // TODOv3   check this.  // input.value.required,
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

    /* TODOv3 as above we need additional metadata to determine if its required or validation
    if (field.required) {
      appFields.schema.inputs[input.name] =
        appFields.schema.inputs[input.name].required('Required');
    }
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
