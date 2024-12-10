import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import FormField from '_common/Form/FormField';
import { Button, Message } from '_common';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import styles from './DataFilesProjectEditDescription.module.scss';
import { useAddonComponents } from 'hooks/datafiles';

const DataFilesProjectEditDescriptionModal = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.files.modals.editproject);
  const { title, description, projectId } = useSelector(
    (state) => state.projects.metadata
  );
  const isUpdating = useSelector((state) => {
    return (
      state.projects.operation &&
      state.projects.operation.name === 'titleDescription' &&
      state.projects.operation.loading
    );
  });
  const updatingError = useSelector((state) => {
    return (
      state.projects.operation &&
      state.projects.operation.name === 'titleDescription' &&
      state.projects.operation.error
    );
  });

  const portalName = useSelector((state) => state.workbench.portalName);
  const { DataFilesProjectEditDescriptionModalAddon } = useAddonComponents({
    portalName,
  });

  const initialValues = useMemo(
    () => ({
      title,
      description: description || '',
    }),
    [title, description]
  );

  const toggle = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'editproject', props: {} },
    });
  };

  const setProjectTitleDescription = useCallback(
    (values) => {
      dispatch({
        type: 'PROJECTS_SET_TITLE_DESCRIPTION',
        payload: {
          projectId,
          data: {
            title: values.title,
            description: values.description || '',
            metadata: DataFilesProjectEditDescriptionModalAddon ? values : null,
          },
          modal: 'editproject',
        },
      });
    },
    [projectId, dispatch]
  );

  const [validationSchema, setValidationSchema] = useState(
    Yup.object().shape({
      title: Yup.string()
        .min(3, 'Title must be at least 3 characters')
        .max(150, 'Title must be at most 150 characters')
        .required('Please enter a title.'),
      description: Yup.string().max(
        800,
        'Description must be at most 800 characters'
      ),
    })
  );

  return (
    <Modal size="xl" isOpen={isOpen} toggle={toggle} className="dataFilesModal">
      <Formik
        initialValues={initialValues}
        onSubmit={setProjectTitleDescription}
        validationSchema={validationSchema}
      >
        {({ isValid, dirty }) => (
          <Form>
            <ModalHeader toggle={toggle} charCode="&#xe912;">
              Edit Dataset
            </ModalHeader>
            <ModalBody className={styles['modal-body']}>
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
                className={styles['description-textarea']}
              />
              {DataFilesProjectEditDescriptionModalAddon && (
                <DataFilesProjectEditDescriptionModalAddon
                  setValidationSchema={setValidationSchema}
                />
              )}
            </ModalBody>
            <ModalFooter>
              <div className={styles['button-container']}>
                {updatingError && (
                  <Message type="error" dataTestid="updating-error">
                    Something went wrong.
                  </Message>
                )}
                <Button
                  attr="submit"
                  type="primary"
                  size="long"
                  className={styles['update-button']}
                  disabled={!isValid || !dirty}
                  isLoading={isUpdating}
                >
                  Update Changes
                </Button>
              </div>
            </ModalFooter>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};

export default DataFilesProjectEditDescriptionModal;
