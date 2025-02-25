import React, { useEffect, useMemo, useState } from 'react';
import FormField from '../FormField';
import { Button, Expand, InlineMessage } from '_common';
import { useFormikContext } from 'formik';
import { FormGroup, Input } from 'reactstrap';
import { FieldArray } from 'formik';
import styles from './DynamicForm.module.scss';
import { useSelector } from 'react-redux';

const DynamicForm = ({ initialFormFields, onChange }) => {
  const [formFields, setFormFields] = useState(initialFormFields);
  const { setFieldValue, values, handleChange, handleBlur } =
    useFormikContext();

  const status = useSelector(
    (state) => state.files.operationStatus.dynamicform
  );

  const handleFilterDependency = (
    field,
    values,
    setFieldValue,
    modifiedField
  ) => {
    const { dependency } = field;
    const filteredOptions = field.options.filter(option => {
      if (option.value === 'other') {
        return true;
      }
      return option.dependentId === values[dependency.name];
    });
    const updatedOptions = [{ value: '', label: '' }, ...filteredOptions];

    // Only update the field value if the modified field is the dependency field
    if (modifiedField && modifiedField.name === dependency.name) {
      setFieldValue(field.name, updatedOptions[0].value);
    }
    return {
      ...field,
      hidden: false,
      filteredOptions: updatedOptions,
      value: '',
    };
  };

  const handleVisibilityDependency = (
    field,
    values,
    setFieldValue,
    modifiedField
  ) => {
    const { dependency } = field;

    // Stores the value of the dependency field that is currently entered in the form
    let currentDependencyFieldValue;

    // If the dependency field is a nested field (e.g. sample.type)
    if (dependency.name.includes('.')) {
      const [dependencyName, nestedDependencyField] =
        dependency.name.split('.');
      const dependentFormField = formFields.find(
        (field) => field.name === dependencyName
      );
      // converts both values to string to compare
      const dependentField = dependentFormField?.options.find(
        (option) => `${option.value}` === `${values[dependencyName]}`
      );

      currentDependencyFieldValue = dependentField
        ? dependentField[nestedDependencyField]
        : null;
    } else {
      currentDependencyFieldValue = values[dependency.name];
    }

    const isHidden = Array.isArray(dependency.value)
      ? !dependency.value.includes(currentDependencyFieldValue)
      : dependency.value !== currentDependencyFieldValue;

    // Resets the fields value when the field is hidden
    if (isHidden) {
      setFieldValue(field.name, '');
    }

    return { ...field, hidden: isHidden };
  };

  const updateFormFieldsBasedOnDependency = useMemo(() => {
    return (formFields, values, setFieldValue, modifiedField) => {
      return formFields.map((field) => {
        const { dependency } = field;

        if (dependency) {
          if (dependency.type === 'filter') {
            return handleFilterDependency(
              field,
              values,
              setFieldValue,
              modifiedField
            );
          } else if (dependency.type === 'visibility') {
            return handleVisibilityDependency(
              field,
              values,
              setFieldValue,
              modifiedField
            );
          }
        }
        return field;
      });
    };
  }, []);

  useEffect(() => {
    const updatedFormFields = updateFormFieldsBasedOnDependency(
      initialFormFields,
      values,
      setFieldValue
    );
    setFormFields(updatedFormFields);
  }, [updateFormFieldsBasedOnDependency, values]);

  useEffect(() => {
    onChange && onChange(formFields, values);
  }, [formFields, values]);

  // This function updates and filters any dependant fields. Field dependency is described in the form config file
  const handleDependentFieldUpdate = (value, modifiedField) => {
    const updatedFormFields = updateFormFieldsBasedOnDependency(
      formFields,
      { ...values, [modifiedField.name]: value },
      setFieldValue,
      modifiedField
    );
    setFormFields(updatedFormFields);
  };

  const renderFormField = (field) => {
    if (field.hidden) {
      return null;
    }

    switch (field.type) {
      case 'text':
      case 'number':
      case 'link':
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
              : // shows only filtered fields
              field.filteredOptions
              ? field.filteredOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))
              : // shows all fields
                field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
          </FormField>
        );
      // uses FieldArray from formik to handle array fields. arrayHelpers from FieldArray is used to add and remove fields
      case 'array':
        return (
          <>
            <FieldArray
              key={field.name}
              name={field.name}
              render={(arrayHelpers) => (
                <div>
                  <div>
                    <h2>{field.label}</h2>
                  </div>
                  {values[field.name]?.map((_, index) => (
                    <div
                      key={index}
                      className={styles['array-input-container']}
                    >
                      <Expand
                        className={styles['expand-card']}
                        detail={
                          values[field.name][index][field.fields[0].name] || ''
                        }
                        isOpenDefault={
                          values[field.name][index][field.fields[0].name] === ''
                            ? true
                            : false
                        }
                        message={
                          <>
                            {field.fields.map((subField) => (
                              <div key={subField.name}>
                                {renderFormField({
                                  ...subField,
                                  name: `${field.name}[${index}].${subField.name}`,
                                })}
                              </div>
                            ))}
                            <Button
                              type="secondary"
                              onClick={() => arrayHelpers.remove(index)}
                            >
                              Remove
                            </Button>
                          </>
                        }
                      />
                    </div>
                  ))}
                  <Button
                    className={styles['button-full']}
                    type="secondary"
                    iconNameBefore={'add'}
                    onClick={() =>
                      arrayHelpers.push(
                        field.fields.reduce((acc, subField) => {
                          acc[subField.name] = '';
                          return acc;
                        }, {})
                      )
                    }
                  >
                    Add {field.label}
                  </Button>
                </div>
              )}
            />
          </>
        );
      case 'radio':
        return (
          <FormGroup>
            <label className={styles['bold-label']}>{field.label}</label>
            {field.options.map((option) => (
              <FormGroup key={option.value} className={styles['radio-input']}>
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
          <>
            {status === 'ERROR' && (
              <InlineMessage type="error">An error has occurred</InlineMessage>
            )}
            <Button
              type={'primary'}
              attr={'submit'}
              size={'long'}
              isLoading={status === 'RUNNING'}
            >
              {field.label}
            </Button>
          </>
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
