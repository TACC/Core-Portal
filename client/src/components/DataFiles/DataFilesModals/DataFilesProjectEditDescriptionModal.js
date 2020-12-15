import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import FormField from '_common/Form/FormField';
import { LoadingSpinner } from '_common';
import { Button, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import './DataFilesProjectEditDescription.module.scss';

const DataFilesProjectEditDescriptionModal = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(state => state.files.modals.editproject);
  const { title, description, projectId } = useSelector(
    state => state.projects.metadata
  );
  const isUpdating = useSelector(state => {
    return (
      state.projects.operation &&
      state.projects.operation.name === 'titleDescription' &&
      state.projects.operation.loading
    );
  });
  const updatingError = useSelector(state => {
    return (
      state.projects.operation &&
      state.projects.operation.name === 'titleDescription' &&
      state.projects.operation.error
    );
  });

  const initialValues = useMemo(
    () => ({
      title,
      description
    }),
    [title, description]
  );

  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'editproject', props: {} }
    });
  };

  const setProjectTitleDescription = useCallback(
    values => {
      dispatch({
        type: 'PROJECTS_SET_TITLE_DESCRIPTION',
        payload: {
          projectId,
          data: {
            title: values.title,
            description: values.description
          }
        }
      });
    },
    [projectId, dispatch]
  );

  const validationSchema = Yup.object().shape({
    title: Yup.string()
      .min(1)
      .required('Please enter a title.'),
    description: Yup.string()
  });

  return (
    <Modal size="lg" isOpen={isOpen} toggle={toggle} className="dataFilesModal">
      <ModalHeader toggle={toggle}>Edit Descriptions</ModalHeader>
      <ModalBody>
        <Formik
          initialValues={initialValues}
          onSubmit={setProjectTitleDescription}
          validationSchema={validationSchema}
        >
          <Form>
            <FormField name="title" label="Workspace Title" />
            <FormField
              name="description"
              label="Workspace Description"
              type="textarea"
              styleName="description-textarea"
            />
            <div styleName="button-container">
              <Button
                type="submit"
                className="data-files-btn"
                styleName="update-button"
                disabled={isUpdating}
              >
                {isUpdating && <LoadingSpinner placement="inline" />}
                {updatingError && (
                  <FontAwesomeIcon
                    icon={faExclamationCircle}
                    data-testid="updating-error"
                  />
                )}
                Update Changes
              </Button>
            </div>
          </Form>
        </Formik>
      </ModalBody>
    </Modal>
  );
};

export default DataFilesProjectEditDescriptionModal;
