import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUtil } from 'utils/fetchUtil';
import { DynamicForm } from '_common/Form/DynamicForm';
import { Form, Formik } from 'formik';
import { Button, Expand, LoadingSpinner, Section, SectionHeader } from '_common';
import styles from './DataFilesPreviewModalAddon.module.scss';
import { useFileListing } from 'hooks/datafiles';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';

const DataFilesPreviewModalAddon = ({ metadata }) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();
  const [isAdvancedImageFile, setIsAdvancedImageFile] = useState(metadata?.is_advanced_image_file ?? false);
  const [expandIsOpen, setExpandIsOpen] = useState(false);

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

  const { is_review_project, is_published_project } = useSelector((state) => state.projects.metadata);

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
      queryKey: ['form-edit-file'],
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

  const onMetadataRemove = ( resetForm ) => {
    resetForm();
    setIsAdvancedImageFile(false);

    dispatch({
      type: 'EDIT_FILE',
      payload: {
        params,
        values: { is_advanced_image_file: false },
        reloadPage,
        selectedFile: file,
      },
    });
  }

  const handleSubmit = (values) => {
    Object.keys(values).forEach((key) => {
      values[key] =
        typeof values[key] === 'string' ? values[key].trim() : values[key];
    });

    dispatch({
      type: 'EDIT_FILE',
      payload: {
        params,
        values: { is_advanced_image_file: isAdvancedImageFile, ...values },
        reloadPage,
        selectedFile: file,
      },
    });
  };

  return (
    <>
      {!isLoading && !is_review_project && !is_published_project && (
        <div className={styles['expand-div']}>
            {!isAdvancedImageFile && (
              <div className={styles['metadata-div']}>
                <Button
                  className={styles['metadata-button']}
                  type={'secondary'} 
                  onClick={() => {
                    setIsAdvancedImageFile(true);
                    setExpandIsOpen(true);
                  }}>
                  + Add Advanced Image File Metadata
                </Button>
              </div>
            )}
          {form && isAdvancedImageFile && (
            <Expand
            detail="Metadata"
            isOpenDefault={expandIsOpen}
            message={
              <>
                <Formik initialValues={initialValues} onSubmit={handleSubmit}>
                  {({ resetForm }) => (
                      <Form>
                      <Section
                        className={styles['section']}
                        contentLayoutName="oneColumn"
                        content={
                          <div>
                            <DynamicForm initialFormFields={form.form_fields ?? []} />
                          </div>
                        }
                      />
                      {form?.footer && (
                        <div className={styles['footer']}>
                          <Button 
                            type={'secondary'} 
                            className={styles['footer-remove-button']}
                            onClick={() => onMetadataRemove(resetForm)}
                          >
                            Remove Metadata
                          </Button>
                          <DynamicForm initialFormFields={form.footer.fields ?? []} />
                        </div>
                      )}
                    </Form>
                  )}
                </Formik>
              </>
            }
          />
          )}
        </div>
      )}
    </>
  );  
};

export default DataFilesPreviewModalAddon;
