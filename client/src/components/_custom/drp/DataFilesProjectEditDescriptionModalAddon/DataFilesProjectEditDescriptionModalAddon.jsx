import React, { useEffect } from 'react';
import { useQuery } from 'react-query';
import { fetchUtil } from 'utils/fetchUtil';
import { DynamicForm } from '_common/Form/DynamicForm';
import { useSelector } from 'react-redux';
import { useFormikContext } from 'formik'


const DataFilesProjectEditDescriptionModalAddon = () => {

  const { setFieldValue } = useFormikContext();
  
  const { data: form, isLoading } = useQuery('form_EDIT_PROJECT', () =>
    fetchUtil({
      url: 'api/forms',
      params: {
        form_name: 'EDIT_PROJECT_ADDON',
      },
    })
  );

  const { metadata } = useSelector(state => state.projects)

  useEffect(() => {
    if (!isLoading && form && metadata) {
      form.form_fields.forEach(field => {
        if (metadata.hasOwnProperty(field.name)) {
          setFieldValue(field.name, metadata[field.name])
        }
      });
    }
  }, [form])

  return (
    <div>
      {!isLoading && form &&
        <DynamicForm formFields={form?.form_fields ?? []} />
      }
    </div>
  );
};

export default DataFilesProjectEditDescriptionModalAddon;