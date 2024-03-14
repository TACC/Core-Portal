import React, { useState } from 'react';
import FormField from '../FormField';
import { Button } from '_common';
import { useFormikContext } from 'formik'
import { FormGroup, Input } from 'reactstrap';
import './DynamicForm.scss';

const DynamicForm = ({ formFields }) => {

  // For file processing
  const { setFieldValue, values, handleChange, handleBlur } = useFormikContext();

  const renderFormField = (field) => {
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
          >
            {field.options.map((option) => {
              return (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              );
            })}
          </FormField>
        );
      case 'radio':
        return (
          <FormGroup>
            <label className='bold-label'>{field.label}</label>
            {field.options.map((option) => (
              <FormGroup key={option.value} className='radio-input'>
              <Input 
                type='radio' 
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
              onChange={(event) => { setFieldValue("file", event.currentTarget.files[0]) }}
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
