import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUtil } from 'utils/fetchUtil';
import { DynamicForm } from '_common/Form/DynamicForm';

const DataFilesAddProjectModalAddon = () => {

  const getProjectFormAddon = async() => {
    const response = await fetchUtil({
      url: '/api/forms',
      params: {
        form_name: 'ADD_PROJECT_ADDON',
      },
    });

    return response;
  }

  const useProjectFormAddon = () => {
    const query = useQuery({
      queryKey: 'form-add-project',
      queryFn: getProjectFormAddon,
    });
    return query;
  }

  const { data: form, isLoading } = useProjectFormAddon();

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
