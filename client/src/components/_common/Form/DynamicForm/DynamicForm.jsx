import React, { useEffect, useState } from 'react';
import FormField from '../FormField';
import { Button } from '_common';
import { useFormikContext } from 'formik';
import { FormGroup, Input } from 'reactstrap';
import './DynamicForm.scss';

const updateFormFieldsBasedOnDependency = (formFields, values, setFieldValue, modifiedField) => {
  return formFields.map((field) => {

    const { dependency } = field;

    if (dependency) {
      if (dependency.type === 'filter') {
        const filteredOptions = field.options.filter(option => option.dependentId == values[dependency.name]);
        const updatedOptions = [{ value: '', label: '' }, ...filteredOptions];

        // only update the field value if the modified field is the dependency field
        if (modifiedField && modifiedField.name === dependency.name) {
          setFieldValue(field.name, updatedOptions[0].value);
        }

        return { ...field, hidden: false, filteredOptions: updatedOptions, value: '' };
      } else if (dependency.type === 'visibility') {
        if (dependency.value) {
          return { ...field, hidden: field.dependency.value !== values[field.dependency.name] };
        } else {
          return { ...field, hidden: !field.hidden };
        }
      }
    }
    return field;
  });
};

const DynamicForm = ({ initialFormFields }) => {

  const [formFields, setFormFields] = useState(initialFormFields);
  // For file processing
  const { setFieldValue, values, handleChange, handleBlur } = useFormikContext();

  // This function updates and filters any dependant fields. Field dependency is described in the form config file
  const handleDependentFieldUpdate = (value, modifiedField) => {
    const updatedFormFields = updateFormFieldsBasedOnDependency(formFields, { ...values, [modifiedField.name]: value }, setFieldValue, modifiedField);
    setFormFields(updatedFormFields);
  };

  useEffect(() => {
    const updatedFormFields = updateFormFieldsBasedOnDependency(formFields, values);
    setFormFields(updatedFormFields);
  }, []);

  const renderFormField = (field) => {

    if (field.hidden) {
      return null;
    }

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <FormField
            name={field.name}
            type={field.type}
            label={field.label}
            description={field?.description}
            required={field?.validation?.required}
          />
        );
      case 'textarea':
        return (
          <FormField
            name={field.name}
            label={field.label}
            type="textarea"
            rows={5}
            description={field?.description}
            required={field?.validation?.required}
          />
        );
      case 'select':
        return (
          <FormField
            name={field.name}
            label={field.label}
            type="select"
            description={field?.description}
            required={field?.validation?.required}
            onChange={(event) => {
              setFieldValue(field.name, event.target.value);
              handleDependentFieldUpdate(event.target.value, field);
            }}
          >
            {/* If we have a select with optgroup */}
            {field.optgroups
              ? field.optgroups.map((optgroup) => {
                  return (
                    <optgroup label={optgroup.label}>
                      {optgroup.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </optgroup>
                  );
                })
              : 
              // shows only filtered fields
              field.filteredOptions ? field.filteredOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              )) :
              // shows all fields
              field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
          </FormField>
        );

      case 'radio':
        return (
          <FormGroup>
            <label className="bold-label">{field.label}</label>
            {field.options.map((option) => (
              <FormGroup key={option.value} className="radio-input">
                <Input
                  type="radio"
                  id={option.value}
                  name={field.name}
                  value={option.value}
                  checked={values[field.name] === option.value}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <label htmlFor={option.value}>{option.label}</label>
              </FormGroup>
            ))}
          </FormGroup>
        );
      case 'file': // Adding support for file type
        return (
          <div>
            <FormField
              name={field.name}
              label={field.label}
              type="file"
              description={field?.description}
              required={field?.validation?.required}
              onChange={(event) => {
                setFieldValue('file', event.currentTarget.files[0]);
              }}
            />
          </div>
        );
      case 'submit':
        return (
          <Button type={'primary'} attr={'submit'} size={'long'}>
            {field.label}
          </Button>
        );
    }
  };

  return (
    <>
      {formFields.map((field) => (
        <div key={field.name}>{renderFormField(field)}</div>
      ))}
    </>
  );
};

export default DynamicForm;
