import React from 'react';
import FormField from '../FormField';

const DynamicForm = ({ formFields }) => {
  const renderFormField = (field) => {
    switch (field.type) {
      case 'text':
        return <FormField name={field.name} label={field.label} />;
      case 'textarea':
        return <FormField name={field.name} label={field.label} type="textarea" />
      case 'select':
        return (
          <FormField name={field.name} label={field.label} type="select">
            {field.options.map((option) => {
              return (
                <option key={option.value} value={option.value}>
                  {option.name}
                </option>
              );
            })}
          </FormField>
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
