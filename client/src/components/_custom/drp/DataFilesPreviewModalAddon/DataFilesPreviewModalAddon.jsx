import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUtil } from 'utils/fetchUtil';
import { DynamicForm } from '_common/Form/DynamicForm';
import { Form, Formik } from 'formik';
import { Expand, LoadingSpinner, Section, SectionHeader } from '_common';
import styles from './DataFilesPreviewModalAddon.module.scss';
import { useFileListing } from 'hooks/datafiles';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';

const DataFilesPreviewModalAddon = ({ metadata }) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();

  // regex from old digitalrocks portal
  const standardImageType = /(\.|\/)(gif|jpe?g|png|tiff?)$/i;

  const status = useSelector(
    (state) => state.files.operationStatus.dynamicform
  );

  useEffect(() => {
    if (status === 'SUCCESS') {
      dispatch({
        type: 'DATA_FILES_TOGGLE_MODAL',
        payload: { operation: 'preview', props: {} },
      });
    }
  }, [status, dispatch]);

  const { params } = useFileListing('FilesListing');

  const { ...file } = useSelector((state) => state.files.modalProps.preview);


  const getEditFileForm = async() => {
    const response = await fetchUtil({
      url: 'api/forms',
      params: {
        form_name: 'EDIT_FILE',
      },
    });

    return response;
  }

  const useEditFileForm = () => {
    const query = useQuery({
      queryKey: 'form-edit-file',
      queryFn: getEditFileForm,
    });
    return query;
  }

  const { data: form, isLoading } = useEditFileForm();

  const initialValues = form?.form_fields.reduce((acc, field) => {
    let value = '';
    if (field.optgroups) {
      value = field.optgroups[0].options[0]?.value;
    } else {
      value =
        field.options && field.options.length > 0 ? field.options[0].value : '';
    }

    acc[field.name] = metadata ? metadata[field.name] : value;
    return acc;
  }, {});

  const reloadPage = () => {
    history.replace(location.pathname);
  };

  const handleSubmit = (values) => {
    Object.keys(values).forEach((key) => {
      values[key] =
        typeof values[key] === 'string' ? values[key].trim() : values[key];
    });

    dispatch({
      type: 'EDIT_FILE',
      payload: {
        params,
        values,
        reloadPage,
        selectedFile: file,
      },
    });
  };

  return (
    !isLoading &&
    form &&
    !standardImageType.test(file.name) && (
      <>
        <Expand
          detail={'Metadata'}
          message={
            <Formik initialValues={initialValues} onSubmit={handleSubmit}>
              <Form>
                <Section
                  className={styles['section']}
                  contentLayoutName={'oneColumn'}
                  content={
                    <div>
                      <DynamicForm initialFormFields={form.form_fields ?? []} />
                    </div>
                  }
                />
                {form?.footer && (
                  <div className={`${styles['footer']}`}>
                    <DynamicForm
                      initialFormFields={form.footer.fields ?? []}
                    ></DynamicForm>
                  </div>
                )}
              </Form>
            </Formik>
          }
        />
      </>
    )
  );
};

export default DataFilesPreviewModalAddon;
