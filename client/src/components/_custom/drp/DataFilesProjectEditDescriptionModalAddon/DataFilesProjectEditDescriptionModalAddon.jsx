import React, { useEffect } from 'react';
import { useQuery } from 'react-query';
import { fetchUtil } from 'utils/fetchUtil';
import { DynamicForm } from '_common/Form/DynamicForm';
import { useSelector } from 'react-redux';
import { useFormikContext } from 'formik'
import * as Yup from 'yup';

const DataFilesProjectEditDescriptionModalAddon = ({ setValidationSchema }) => {

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

  const onFormChange = (formFields, values) => {

    let schema = {}

    Object.keys(values).forEach(key => {
      const field = formFields.find((f) => f.name === key);

      if (field) {
        if (field.type === 'array') {
          schema[key] = Yup.array().of(
            Yup.object().shape(
              field.fields.reduce((acc, subField) => {
                if (subField.validation?.required) {
                  acc[subField.name] = Yup.string().required(
                    `${subField.label} is required`
                  );
                }
                return acc;
              }, {})
            )
          );
        } else {
          schema[key] = Yup.string().required(
            `${field.label} is required`
          );
        }
      }
    })

    setValidationSchema((prevSchema) => {
      return Yup.object().shape({
        ...prevSchema?.fields,
        ...schema
      })
    })
  }

  return (
    <div>
      {!isLoading && form &&
        <DynamicForm initialFormFields={form?.form_fields ?? []} onChange={(formFields, values) => onFormChange(formFields, values)}/>
      }
    </div>
  );
};

export default DataFilesProjectEditDescriptionModalAddon;