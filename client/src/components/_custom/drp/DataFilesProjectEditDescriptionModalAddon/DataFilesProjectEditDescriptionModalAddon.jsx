import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUtil } from 'utils/fetchUtil';
import { DynamicForm } from '_common/Form/DynamicForm';
import { useSelector } from 'react-redux';
import { useFormikContext } from 'formik';
import * as Yup from 'yup';
import styles from './DataFilesProjectEditDescriptionModalAddon.module.scss';

const DataFilesProjectEditDescriptionModalAddon = ({ setValidationSchema }) => {
  const { setFieldValue } = useFormikContext();

  const getEditProjectFormAddon = async () => {
    const response = await fetchUtil({
      url: '/api/forms',
      params: {
        form_name: 'EDIT_PROJECT_ADDON',
      },
    });

    return response;
  };

  const useEditProjectFormAddon = () => {
    const query = useQuery({
      queryKey: ['form-edit-project'],
      queryFn: getEditProjectFormAddon,
    });
    return query;
  };

  const { data: form, isLoading } = useEditProjectFormAddon();

  const { metadata } = useSelector((state) => state.projects);

  useEffect(() => {
    if (!isLoading && form && metadata) {
      form.form_fields.forEach((field) => {
        if (metadata.hasOwnProperty(field.name)) {
          // If the field is an array, we need to set the value for each subfield using index to access the correct value
          if (field.type === 'array') {
            metadata[field.name].forEach((item, index) => {
              field.fields.forEach((subField) => {
                setFieldValue(
                  `${field.name}[${index}].${subField.name}`,
                  item[subField.name]
                );
              });
            });
          } else {
            if (field.type === 'file') {
              field.file_name = metadata[field.name].split('/').pop();
              field.file_url = metadata['file_url'];
              return;
            }
            setFieldValue(field.name, metadata[field.name]);
          }
        }
      });
    }
  }, [form]);

  const onFormChange = (formFields, values) => {
    const schema = formFields.reduce((acc, field) => {
      if (field.type === 'array') {
        acc[field.name] = Yup.array().of(
          Yup.object().shape(
            field.fields.reduce((subAcc, subField) => {
              if (subField.type === 'link') {
                subAcc[subField.name] = (subAcc[subField.name] || Yup.string())
                  .url(
                    `${subField.label} must be a valid URL starting with https://...`
                  )
                  .matches(
                    /^https:\/\//,
                    `${subField.label} must start with https://`
                  );
              }
              if (subField.validation?.required) {
                subAcc[subField.name] = (
                  subAcc[subField.name] || Yup.string()
                ).required(`${subField.label} is required`);
              }
              if (subField.type === 'textarea') {
                subAcc[subField.name] = (subAcc[subField.name] || Yup.string())
                  .min(
                    subField.validation?.min ?? -Infinity,
                    `${subField.label} must be greater than or equal to ${subField.validation?.min} characters`
                  )
                  .max(
                    subField.validation?.max ?? Infinity,
                    `${subField.label} must be less than or equal to ${subField.validation?.max} characters`
                  )
              }

              return subAcc;
            }, {})
          )
        );
      } else {
        if (field.validation?.required) {
          acc[field.name] = (acc[field.name] || Yup.string()).required(
            `${field.label} is required`
          );
        }
        if (field.type === 'link') {
          acc[field.name] = (acc[field.name] || Yup.string())
            .required(`${field.label} is required`)
            .url(`${field.label} must be a valid URL starting with https://...`)
            .matches(/^https:\/\//, `${field.label} must start with https://`);
        }
      }
      return acc;
    }, {});

    setValidationSchema((prevSchema) => {
      return Yup.object().shape({
        ...prevSchema?.fields,
        ...schema,
      });
    });
  };

  return (
    <div className={styles['dataset-form-container']}>
      {!isLoading && form && (
        <DynamicForm
          initialFormFields={form?.form_fields ?? []}
          onChange={(formFields, values) => onFormChange(formFields, values)}
        />
      )}
    </div>
  );
};

export default DataFilesProjectEditDescriptionModalAddon;
