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

  const reloadPage = () => {
    history.push(location.pathname);
  };

  const { formName, selectedFile } = useSelector(
    (state) => state.files.modalProps.dynamicform
  );
  const isOpen = useSelector((state) => state.files.modals.dynamicform);
  const { params } = useFileListing('FilesListing');

  const getFormFields = async (formName) => {
    const response = await fetchUtil({
      url: 'api/forms',
      params: {
        form_name: formName,
      },
    });
    return response;
  };

  const useFormFields = (formName) => {
    const query = useQuery(['form', formName], () => getFormFields(formName), {
      enabled: !!formName,
    });
    return query;
  };

  const { data: form, isLoading } = useFormFields(formName);
  const { selectedFiles } = useSelectedFiles();

  const initialValues = form?.form_fields.reduce((acc, field) => {
    acc[field.name] = selectedFile ? selectedFile.metadata[field.name] : ''
    return acc;
  }, {});

  const toggle = useCallback(() => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'dynamicform', props: {} },
    });
  }, []);

  const handleSubmit = (values) => {
    dispatch({
      type: formName,
      payload: { params, values, reloadPage, selectedFile: selectedFiles[0] },
    });
  };

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
            <Formik onSubmit={handleSubmit} initialValues={initialValues}>
              <Form>
                <ModalHeader toggle={toggle} charCode="&#xe912;">
                  {form.heading}
                </ModalHeader>
                <ModalBody className={styles['modal-body-container']}>
                  <DynamicForm
                    formFields={form.form_fields ?? []}
                  ></DynamicForm>
                </ModalBody>
                {form?.footer && (
                  <ModalFooter>
                    <DynamicForm
                      formFields={form.footer.fields ?? []}
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
