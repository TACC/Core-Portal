import React, { useCallback } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { DynamicForm } from '_common/Form/DynamicForm';
import { useQuery } from 'react-query';
import { fetchUtil } from 'utils/fetchUtil';
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
    // using regex to get the url up until the project name
    const projectUrl = location.pathname.replace(/(\/projects\/[^/]+\/).*/, '$1');

    const path = updatedPath ? `${projectUrl}${updatedPath}` : `${projectUrl}`;
    history.push(path);
  };

  const { form, selectedFile, formName, additionalData } = useSelector(
    (state) => state.files.modalProps.dynamicform
  );
  const isOpen = useSelector((state) => state.files.modals.dynamicform);
  const { params } = useFileListing('FilesListing');

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

    Object.keys(values).forEach(key => {
      values[key] = typeof(values[key]) === 'string' ? values[key].trim() : values[key];
    });

    dispatch({
      type: formName,
      payload: {
        params,
        values,
        reloadPage,
        selectedFile,
        additionalData,
      },
    });
  };

  const validationSchema = Yup.object().shape({
    ...(form?.form_fields ?? []).reduce((schema, field) => {
      if (field.validation?.required) {
        schema[field.name] = Yup.string().required(
          `${field.label} is required`
        );
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
