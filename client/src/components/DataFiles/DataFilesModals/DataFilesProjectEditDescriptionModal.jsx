import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import FormField from '_common/Form/FormField';
import { Button, Message } from '_common';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import styles from './DataFilesProjectEditDescription.module.scss';

const DataFilesProjectEditDescriptionModal = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.files.modals.editproject);
  const { title, description, projectId, keywords } = useSelector(
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
  const maxDescriptionLength =
    useSelector((state) => state.workbench.config.maxDescriptionLength) ?? 800;
  const maxTitleLength =
    useSelector((state) => state.workbench.config.maxTitleLength) ?? 150;
  const enableWorkspaceKeywords =
    useSelector((state) => state.workbench.config.enableWorkspaceKeywords) ??
    true;

  const initialValues = useMemo(
    () => ({
      title,
      description: description || '',
      keywords: keywords || [],
    }),
    [title, description, keywords]
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
            keywords: values.keywords.trim() || '',
          },
        },
      });
    },
    [projectId, dispatch]
  );

  const validationSchema = Yup.object().shape({
    title: Yup.string()
      .min(3, 'Title must be at least 3 characters')
      .max(maxTitleLength, `Title must be at most ${maxTitleLength} characters`)
      .required('Please enter a title.'),
    description: Yup.string()
      .max(
        maxDescriptionLength,
        `Description must be at most ${maxDescriptionLength} characters`
      )
      .when([], {
        is: () => maxDescriptionLength > 0,
        then: (schema) => schema.required('Please enter a description.'),
        otherwise: (schema) => schema.notRequired(),
      }),
    keywords: Yup.string().matches(
      /^\s*[\w-]+(\s*,\s*[\w-]+)*\s*$/,
      'Please separate keywords with commas.'
    ),
  });

  return (
    <Modal size="lg" isOpen={isOpen} toggle={toggle} className="dataFilesModal">
      <ModalHeader toggle={toggle} charCode="&#xe912;">
        Edit Workspace
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
                    Title{' '}
                    <small>
                      <em>(Maximum {maxTitleLength} characters)</em>
                    </small>
                  </div>
                }
              />
              {!!maxDescriptionLength && (
                <FormField
                  name="description"
                  aria-label="description"
                  label={
                    <div>
                      Description{' '}
                      <small>
                        <em>(Maximum {maxDescriptionLength} characters)</em>
                      </small>
                    </div>
                  }
                  type="textarea"
                  className={styles['description-textarea']}
                />
              )}
              {!!enableWorkspaceKeywords && (
                <FormField
                  name="keywords"
                  aria-label="keywords"
                  tags
                  label={
                    <div>
                      Keywords{' '}
                      <small>
                        <em>(Optional, should be comma-separated)</em>
                      </small>
                    </div>
                  }
                  type="textarea"
                  className={styles['description-textarea']}
                />
              )}
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
            </Form>
          )}
        </Formik>
      </ModalBody>
    </Modal>
  );
};

export default DataFilesProjectEditDescriptionModal;
