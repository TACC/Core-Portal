import React from 'react';
import { useQuery } from 'react-query';
import { fetchUtil } from 'utils/fetchUtil';
import { DynamicForm } from '_common/Form/DynamicForm';

const DataFilesProjectEditDescriptionModalAddon = () => {
  
  const { data: form, isLoading } = useQuery('form_EDIT_PROJECT', () =>
    fetchUtil({
      url: 'api/forms',
      params: {
        form_name: 'EDIT_PROJECT_ADDON',
      },
    })
  );
  return (
    <div>
        <DynamicForm formFields={form?.form_fields ?? []} />
    </div>
  );
};

export default DataFilesProjectEditDescriptionModalAddon;