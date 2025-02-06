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

    const filteredOptions = field.options.filter(
      (option) => option.dependentId == values[dependency.name]
    );
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

  const handleVisibilityDependency = (field, values, setFieldValue, modifiedField) => {
    const { dependency } = field;
    if (!dependency) return field;
  
    let currentDependencyFieldValue = values[dependency.name];
  
    const isHidden = Array.isArray(dependency.value)
      ? !dependency.value.includes(currentDependencyFieldValue)
      : dependency.value !== currentDependencyFieldValue;
  
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

  const handleDependentFieldUpdate = (value, modifiedField) => {
    const updatedFormFields = updateFormFieldsBasedOnDependency(
      formFields,
      { ...values, [modifiedField.name]: value },
      setFieldValue,
      modifiedField
    );
  
    setFormFields(updatedFormFields.map((field) => {
      if (field.name === 'digital_dataset_other') {
        return { ...field, hidden: value !== 'other' };
      }
      return field;
    }));
  };
  

  const renderFormField = (field) => {
    if (field.hidden) {
      return null;
    }

    switch (field.type) {
      case 'text':
      return (
        <FormField
          name={field.name}
          label={field.label}
          type="text"
          description={field?.description}
          required={field?.validation?.required}
        />
      );
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
                const selectedValue = event.target.value;
                setFieldValue(field.name, selectedValue);
                handleDependentFieldUpdate(selectedValue, field);
        
                setFormFields((prevFields) =>
                  prevFields.map((f) =>
                    f.name === 'digital_dataset_other' ? { ...f, hidden: selectedValue !== 'other' } : f
                  )
                );
              }}
            >
              {field.options.map((option) => (
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
