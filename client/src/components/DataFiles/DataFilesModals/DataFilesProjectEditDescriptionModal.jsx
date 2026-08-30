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
  const minDescriptionLength =
    useSelector((state) => state.workbench.config.minDescriptionLength) ?? 50;
  const maxTitleLength =
    useSelector((state) => state.workbench.config.maxTitleLength) ?? 150;
  const enableWorkspaceKeywords =
    useSelector((state) => state.workbench.config.enableWorkspaceKeywords) ??
    true;

  const portalName = useSelector((state) => state.workbench.portalName);
  const { DataFilesProjectEditDescriptionModalAddon } = useAddonComponents({
    portalName,
  });

  const isOwner = useSelector(
    (state) =>
      state.projects.metadata.members
        .filter((member) =>
          member.user
            ? member.user.username === state.authenticatedUser?.user?.username
            : { access: null }
        )
        .map((currentUser) => currentUser.access === 'owner')[0]
  );

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
            keywords: values.keywords || [],
            metadata: DataFilesProjectEditDescriptionModalAddon ? values : null,
          },
          modal: 'editproject',
        },
      });
    },
    [projectId, dispatch]
  );

  const [validationSchema, setValidationSchema] = useState(Yup.object().shape({
    title: Yup.string()
      .min(3, 'Title must be at least 3 characters')
      .max(maxTitleLength, `Title must be at most ${maxTitleLength} characters`)
      .required('Please enter a title.'),
    description: Yup.string()
      .min(
        minDescriptionLength,
        `Description must be at least ${minDescriptionLength} characters`
      )
      .when([], {
        is: () => minDescriptionLength > 0,
        then: (schema) => schema.required('Please enter a description.'),
        otherwise: (schema) => schema.notRequired(),
      }),
    ...(enableWorkspaceKeywords && {
      keywords: Yup.array().of(Yup.string()
      ),
    }),
  }));

  return (
    <Modal size="xl" isOpen={isOpen} toggle={toggle} className="dataFilesModal">
      {/* <ModalBody> */}
        <Formik
          initialValues={initialValues}
          initialTouched={{
            title: true,
            description: true,
            keywords: true,
          }}
          onSubmit={setProjectTitleDescription}
          validationSchema={validationSchema}
          validateOnMount
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
                  disabled={!isOwner}
                  label={
                    <div>
                      Title{' '}
                      <small>
                        <em>(Maximum {maxTitleLength} characters)</em>
                      </small>
                    </div>
                  }
                />
                {!!minDescriptionLength && (
                  <FormField
                    name="description"
                    aria-label="description"
                    disabled={!isOwner}
                    label={
                      <div>
                        Description{' '}
                        <small>
                          <em>(Minimum {minDescriptionLength} characters)</em>
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
                    label={<div>Keywords</div>}
                    type="textarea"
                    className={styles['description-textarea']}
                  />
                )}
                {DataFilesProjectEditDescriptionModalAddon && (
                  <DataFilesProjectEditDescriptionModalAddon
                    setValidationSchema={setValidationSchema}
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
                    disabled={!isValid}
                    className={styles['update-button']}
                    isLoading={isUpdating}
                  >
                    Update Changes
                  </Button>
                </div>
              </ModalBody>
          </Form>
        )}
      </Formik>
      {/* </ModalBody> */}
    </Modal>
  );
};

export default DataFilesProjectEditDescriptionModal;
