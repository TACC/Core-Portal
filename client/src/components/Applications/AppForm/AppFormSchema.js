import * as Yup from 'yup';

const FormSchema = (app) => {
  const appFields = {
    parameters: {},
    inputs: {},
    defaults: { inputs: {}, parameters: {} },
    schema: { inputs: {}, parameters: {} },
  };

  Yup.addMethod(Yup.array, 'oneOfSchemas', function (schemas) {
    return this.test(
      'one-of-schemas',
      'Not all items in ${path} match one of the allowed schemas',
      (items) =>
        items.every((item) => {
          return schemas.some((schema) =>
            schema.isValidSync(item, { strict: true })
          );
        })
    );
  });

  (app.definition.parameters || []).forEach((parameter) => {
    const param = parameter;
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

    field.multiinput = false;
    if (param.semantics.maxCardinality > 1) {
      field.multiinput = true;
      field.maxitems = param.semantics.maxCardinality;
      field.minitems = param.semantics.minCardinality;
    }

    switch (param.value.type) {
      case 'bool':
      case 'flag':
        field.type = 'checkbox';
        field.checked = param.value.default || false;
        appFields.schema.parameters[param.id] = field.multiinput
          ? Yup.array().of(Yup.boolean())
          : Yup.boolean();
        break;

      case 'enumeration':
        field.type = 'select';
        field.options = param.value.enum_values;
        appFields.schema.parameters[param.id] = field.multiinput
          ? Yup.array().of(
              Yup.string().oneOf(
                field.options.map((enumVal) => {
                  if (typeof enumVal === 'string') {
                    return enumVal;
                  }
                  return Object.keys(enumVal)[0];
                })
              )
            )
          : Yup.string().oneOf(
              field.options.map((enumVal) => {
                if (typeof enumVal === 'string') {
                  return enumVal;
                }
                return Object.keys(enumVal)[0];
              })
            );
        break;

      case 'number':
        appFields.schema.parameters[param.id] = field.multiinput
          ? Yup.array().of(Yup.number())
          : Yup.number();
        field.type = 'number';
        break;

      case 'string':
        field.agaveFile = param.semantics.ontology.includes('agaveFile');
        if (param.semantics.ontology.includes('email')) {
          field.type = 'email';
          appFields.schema.parameters[param.id] = field.multiinput
            ? Yup.array().of(Yup.string().email('Must be a valid email.\n'))
            : Yup.string().email('Must be a valid email.');
        } else {
          field.type = 'text';
          appFields.schema.parameters[param.id] = field.multiinput
            ? Yup.array().of(Yup.string())
            : Yup.string();
        }
        break;
      default:
        appFields.schema.parameters[param.id] = field.multiinput
          ? Yup.array().of(Yup.string())
          : Yup.string();
        field.type = 'text';
    }

    if (param.value.required) {
      appFields.schema.parameters[param.id] =
        appFields.schema.parameters[param.id].required('Required');
    }
    if (param.value.validator) {
      appFields.schema.parameters[param.id] = appFields.schema.parameters[
        param.id
      ].matches(param.value.validator);
    }
    appFields.parameters[param.id] = field;
    appFields.defaults.parameters[param.id] =
      param.value.default === null || typeof param.value.default === 'undefined'
        ? ''
        : param.value.default;
  });

  (app.definition.inputs || []).forEach((i) => {
    const input = i;
    if (input.id.startsWith('_') || !input.value.visible) {
      return;
    }
    try {
      RegExp(input.value.validator);
    } catch (e) {
      input.value.validator = null;
    }
    const field = {
      label: input.details.label,
      description: input.details.description,
      required: input.value.required,
    };

    field.type = 'text';
    appFields.schema.inputs[input.id] = Yup.string();
    if (input.value.required) {
      appFields.schema.inputs[input.id] =
        appFields.schema.inputs[input.id].required('Required');
    }
    if (input.value.validator) {
      appFields.schema.inputs[input.id] = appFields.schema.inputs[
        input.id
      ].matches(input.value.validator);
    } else {
      appFields.schema.inputs[input.id] = appFields.schema.inputs[
        input.id
      ].matches(
        /^agave:\/\//g,
        "Input file must be a valid Tapis URI, starting with 'agave://'"
      );
    }
    appFields.inputs[input.id] = field;
    appFields.defaults.inputs[input.id] =
      input.value.default === null || typeof input.value.default === 'undefined'
        ? ''
        : input.value.default;

    field.multiinput = false;
    if (input.semantics.maxCardinality > 1) {
      field.multiinput = true;
      field.maxitems = input.semantics.maxCardinality;
      field.minitems = input.semantics.minCardinality;
      appFields.schema.inputs[input.id] = Yup.array().of(Yup.string());
    }
  });
  return appFields;
};

export default FormSchema;
