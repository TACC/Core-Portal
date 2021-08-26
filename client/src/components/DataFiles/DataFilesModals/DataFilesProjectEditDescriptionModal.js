import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import FormField from '_common/Form/FormField';
import { LoadingSpinner, Message } from '_common';
import { Button, Modal, ModalHeader, ModalBody } from 'reactstrap';
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
      description: description || ''
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
            description: values.description || ''
          }
        }
      });
    },
    [projectId, dispatch]
  );

  const validationSchema = Yup.object().shape({
    title: Yup.string()
      .min(3, 'Title must be at least 3 characters')
      .max(150, 'Title must be at most 150 characters')
      .required('Please enter a title.'),
    description: Yup.string().max(
      800,
      'Description must be at most 800 characters'
    )
  });

  return (
    <Modal size="lg" isOpen={isOpen} toggle={toggle} className="dataFilesModal">
      <ModalHeader toggle={toggle} charCode="&#xe912;">
        Edit Descriptions
      </ModalHeader>
      <ModalBody>
        <Formik
          initialValues={initialValues}
          onSubmit={setProjectTitleDescription}
          validationSchema={validationSchema}
        >
          {({ isValid, dirty }) => (
            <Form>
              <FormField
                name="title"
                aria-label="title"
                label={
                  <div>
                    Workspace Title{' '}
                    <small>
                      <em>(Maximum 150 characters)</em>
                    </small>
                  </div>
                }
              />
              <FormField
                name="description"
                aria-label="description"
                label={
                  <div>
                    Workspace Description{' '}
                    <small>
                      <em>(Maximum 800 characters)</em>
                    </small>
                  </div>
                }
                type="textarea"
                styleName="description-textarea"
              />
              <div styleName="button-container">
                {updatingError && (
                  <Message type="error" dataTestid="updating-error">
                    Something went wrong.
                  </Message>
                )}
                <Button
                  type="submit"
                  className="data-files-btn"
                  styleName="update-button"
                  disabled={isUpdating || !isValid || !dirty}
                >
                  {isUpdating && <LoadingSpinner placement="inline" />}
                  Update Changes
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </ModalBody>
    </Modal>
  );
};

export default DataFilesProjectEditDescriptionModal;
