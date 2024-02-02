import React, { useCallback } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { DynamicForm } from '_common/Form/DynamicForm';
import { useQuery } from 'react-query';
import { fetchUtil } from 'utils/fetchUtil';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

const DataFilesFormModal = () => {
  const dispatch = useDispatch();

  const { formName } = useSelector(
    (state) => state.files.modalProps.dynamicform
  );
  const isOpen = useSelector((state) => state.files.modals.dynamicform);

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

  const { data, isLoading } = useFormFields(formName);

  const toggle = useCallback(() => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'dynamicform', props: {} },
    });
  }, []);

  return (
    <div>
      <Modal
        size="xl"
        isOpen={isOpen}
        toggle={toggle}
        className="dataFilesModal"
      >
        <Formik>
          <Form>
            <ModalHeader toggle={toggle} charCode="&#xe912;">
              {formName}
            </ModalHeader>
            <ModalBody>
              <DynamicForm formFields={data ?? []}></DynamicForm>
            </ModalBody>
          </Form>
        </Formik>
      </Modal>
    </div>
  );
};

export default DataFilesFormModal;
