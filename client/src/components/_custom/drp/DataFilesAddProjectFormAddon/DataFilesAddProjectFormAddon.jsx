import React from 'react';
import { useQuery } from 'react-query';
import { fetchUtil } from 'utils/fetchUtil';
import { DynamicForm } from '_common/Form/DynamicForm';
const DataFilesProjectFormAddon = () => {
  const { data: form, isLoading } = useQuery('form_ADD_PROJECT', () =>
    fetchUtil({
      url: 'api/forms',
      params: {
        form_name: 'ADD_PROJECT',
      },
    })
  );
  return (
    <div>
      {isLoading ? (
        <p>Loading form...</p>
      ) : (
        <DynamicForm formFields={form?.form_fields ?? []} />
      )}
    </div>
    );
};

export default DataFilesProjectFormAddon;
