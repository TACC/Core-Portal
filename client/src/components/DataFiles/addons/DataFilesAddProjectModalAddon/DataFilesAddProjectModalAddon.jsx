import React from 'react';
import { DynamicForm } from '_common/Form/DynamicForm';
import { useForm } from 'hooks/datafiles';

// Default add-project addon: renders the portal's ADD_PROJECT_ADDON form
// (from settings_forms) alongside the core create-project fields.
const DataFilesAddProjectModalAddon = () => {
  const { data: form, isLoading } = useForm('ADD_PROJECT_ADDON');

  return (
    <div>
      {isLoading ? (
        <p>Loading form...</p>
      ) : (
        <DynamicForm initialFormFields={form?.form_fields ?? []} />
      )}
    </div>
  );
};

export default DataFilesAddProjectModalAddon;
