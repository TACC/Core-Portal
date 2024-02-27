import React, { useState } from 'react';
import FormField from '../FormField';
import { Button } from '_common';

const DynamicForm = ({ formFields }) => {
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
          <div>
            <label className="bold-label">{field.label}</label>
            {field.options.map((option) => (
              <div key={option.value}>
                <input
                  type="radio"
                  id={option.value}
                  name={field.name}
                  value={option.value}
                />
                <label htmlFor={option.value}>{option.label}</label>
              </div>
            ))}
          </div>
  
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
              />
          </div>
        );
      case 'submit':
        return (
          <Button type={'primary'} attr={'submit'}>
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
