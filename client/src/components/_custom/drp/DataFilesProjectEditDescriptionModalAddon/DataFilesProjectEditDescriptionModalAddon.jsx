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
          // If the field is an array, we need to set the value for each subfield using index to access the correct value
          if (field.type === 'array') {
            metadata[field.name].forEach((item, index) => {
              field.fields.forEach(subField => {
                setFieldValue(`${field.name}[${index}].${subField.name}`, item[subField.name])
              });
            })
          } else {
            setFieldValue(field.name, metadata[field.name])
          }
        }
      });
    }
  }, [form])

  return (
    <div>
      {!isLoading && form &&
        <DynamicForm initialFormFields={form?.form_fields ?? []} />
      }
    </div>
  );
};

export default DataFilesProjectEditDescriptionModalAddon;