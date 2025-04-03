import React, { useCallback } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { Modal, ModalHeader, ModalBody, ModalFooter, FormText } from 'reactstrap';
import { DynamicForm } from '_common/Form/DynamicForm';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import styles from './DataFilesFormModal.module.scss';
import { useFileListing, useSelectedFiles } from 'hooks/datafiles';
import { useHistory, useLocation } from 'react-router-dom';

const DataFilesFormModal = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();

  const reloadPage = (updatedPath = '') => {  
    const match = location.pathname.match(/^\/workbench\/data\/tapis\/[^\/]+\/[^\/]+\/[^\/]+/);
    if (!match) return;

    const projectUrl = match[0];
  
    const cleanProjectUrl = projectUrl.replace(/\/$/, '');
    const cleanUpdatedPath = updatedPath.replace(/^\/+/, '');
  
    history.replace(`${cleanProjectUrl}/${cleanUpdatedPath}`);
  };

  const { form, selectedFile, formName, additionalData, useReloadCallback } =
    useSelector((state) => state.files.modalProps.dynamicform);
  const isOpen = useSelector((state) => state.files.modals.dynamicform);
  const { params } = useFileListing('FilesListing');

  // TODO: Add support for array type fields
  const initialValues = form?.form_fields.reduce((acc, field) => {
    let value = '';
    if (field.optgroups) {
      value = field.optgroups[0].options[0]?.value;
    } else {
      value =
        field.options && field.options.length > 0 ? field.options[0].value : '';
    }

    acc[field.name] = selectedFile ? selectedFile.metadata[field.name] : value;
    return acc;
  }, {});

  const toggle = useCallback(() => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'dynamicform', props: {} },
    });
  }, []);

  const handleSubmit = (values) => {
    Object.keys(values).forEach((key) => {
      values[key] =
        typeof values[key] === 'string' ? values[key].trim() : values[key];
    });

    dispatch({
      type: formName,
      payload: {
        params,
        values,
        reloadPage: useReloadCallback ? reloadPage : null,
        selectedFile,
        additionalData,
      },
    });
  };

  const validationSchema = Yup.object().shape({
    ...(form?.form_fields ?? []).reduce((schema, field) => {
      if (field.validation?.required) {
        schema[field.name] = (schema[field.name] || Yup.string()).required(
          `${field.label} is required`
        );
      }

      if (field.type === 'link') {
        schema[field.name] = (schema[field.name] || Yup.string())
          .url(`${field.label} must be a valid URL starting with https://...`)
          .matches(/^https:\/\//, `${field.label} must start with https://`);
      }

      if (field.type === 'number') {
        schema[field.name] = (schema[field.name] || Yup.number())
          .max(field.validation?.max ?? Infinity, `${field.label} must be less than or equal to ${field.validation?.max}`)
          .min(field.validation?.min ?? -Infinity, `${field.label} must be greater than or equal to ${field.validation?.min}`)
      }

      return schema;
    }, {}),
  });

  return (
    <>
      {form && (
        <div>
          <Modal
            size="lg"
            isOpen={isOpen}
            toggle={toggle}
            className={styles['modal-dialog']}
          >
            <Formik
              onSubmit={handleSubmit}
              validationSchema={validationSchema}
              initialValues={initialValues}
            >
              <Form>
                <ModalHeader toggle={toggle} charCode="&#xe912;">
                  {form.heading}
                </ModalHeader>
                <ModalBody className={styles['modal-body-container']}>
                  {form?.description && (
                    <FormText
                      className="form-field__help"
                      color='muted'
                    >
                      {form.description}
                    </FormText>
                  )}
                  <DynamicForm
                    initialFormFields={form.form_fields ?? []}
                  ></DynamicForm>
                </ModalBody>
                {form?.footer && (
                  <ModalFooter>
                    <DynamicForm
                      initialFormFields={form.footer.fields ?? []}
                    ></DynamicForm>
                  </ModalFooter>
                )}
              </Form>
            </Formik>
          </Modal>
        </div>
      )}
    </>
  );
};

export default DataFilesFormModal;
