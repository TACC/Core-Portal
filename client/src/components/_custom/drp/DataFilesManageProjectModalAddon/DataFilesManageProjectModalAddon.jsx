import React, { useState, useCallback, useEffect, useMemo } from 'react';
import * as Yup from 'yup';
import styles from './DataFilesManageProjectModalAddon.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { useSystemRole } from '../../../DataFiles/DataFilesProjectMembers/_cells/SystemRoleSelector';
import { Input, Label } from 'reactstrap';
import { FieldArray, Form, Formik, useFormikContext } from 'formik';
import {
  Button,
  FormField,
  InfiniteScrollTable,
  LoadingSpinner,
  Section,
} from '_common';

const DataFilesManageProjectModalAddon = ({ projectId }) => {
  const dispatch = useDispatch();

  const { metadata } = useSelector((state) => state.projects);

  const { loading, error } = useSelector((state) => {
    if (
      state.projects.operation &&
      state.projects.operation.name === 'titleDescription'
    ) {
      return state.projects.operation;
    }
    return {
      loading: false,
      error: false,
    };
  });

  const authenticatedUser = useSelector(
    (state) => state.authenticatedUser.user.username
  );

  const { query: authenticatedUserQuery } = useSystemRole(
    projectId ?? null,
    authenticatedUser ?? null
  );

  const canEditSystem = ['OWNER', 'ADMIN'].includes(
    authenticatedUserQuery?.data?.role
  );

  const readOnlyTeam = useSelector((state) => {
    const projectSystem = state.systems.storage.configuration.find(
      (s) => s.scheme === 'projects'
    );

    return projectSystem?.readOnly || !canEditSystem;
  });

  const handleRemoveGuestUser = useCallback(
    (email) => {
      const updatedGuestUsers = metadata.guest_users.filter(
        (user) => user.email !== email
      );

      dispatch({
        type: 'PROJECTS_SET_TITLE_DESCRIPTION',
        payload: {
          projectId,
          data: {
            title: metadata.title,
            description: metadata.description || '',
            metadata: {
              guest_users: updatedGuestUsers,
            },
          },
          modal: '',
        },
      });
    },
    [metadata, dispatch, projectId] // Dependency array
  );

  const columns = [
    {
      Header: 'Guest Members',
      accessor: (el) => el,
      Cell: (el) => {
        const { first_name, last_name, email } = el.value;
        return (
          <span>
            <span
              className={styles['printed-name']}
            >{`${first_name} ${last_name}`}</span>
            {` (${email})`}
          </span>
        );
      },
    },
    {
      Header: loading ? (
        <LoadingSpinner
          placement="inline"
          className={styles['guest-members__loading']}
        />
      ) : (
        ''
      ),
      accessor: 'email',
      Cell: (el) => {
        return !readOnlyTeam ? (
          <Button
            type="link"
            onClick={() => handleRemoveGuestUser(el.value)}
            disabled={loading}
          >
            Remove
          </Button>
        ) : null;
      },
    },
  ];

  const onSubmit = useCallback(
    (values) => {
      dispatch({
        type: 'PROJECTS_SET_TITLE_DESCRIPTION',
        payload: {
          projectId,
          data: {
            title: metadata.title,
            description: metadata.description || '',
            metadata: {
              guest_users: [...metadata.guest_users, ...values.guestUsers],
            },
          },
          modal: '',
        },
      });
    },
    [projectId, dispatch, metadata]
  );

  const validationSchema = Yup.object().shape({
    guestUsers: Yup.array().of(
      Yup.object().shape({
        first_name: Yup.string().required('First Name is required'),
        last_name: Yup.string().required('Last Name is required'),
        email: Yup.string()
          .email('Invalid email address')
          .required('Email is required'),
      })
    ),
  });

  return (
    <div className={styles.root}>
      {metadata?.guest_users?.length > 0 && (
        <InfiniteScrollTable
          tableColumns={columns}
          tableData={metadata.guest_users}
          className={styles['guest-user-listing']}
          columnMemoProps={[loading]}
        />
      )}

      {!readOnlyTeam && (
        <>
          <Label className="form-field__label" size="sm">
            Add Guest Member
          </Label>
          <Formik
            initialValues={{ guestUsers: [] }}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
          >
            {({ values, isValid, resetForm }) => {
              useEffect(() => {
                resetForm();
              }, [metadata, resetForm]);

              return (
                <Form>
                  <FieldArray name="guestUsers">
                    {({ remove, push }) => (
                      <>
                        {/* Render only if there are guest users */}
                        {values.guestUsers.length > 0 &&
                          values.guestUsers.map((_, index) => (
                            <Section
                              key={index}
                              contentClassName={`${styles['form-div']}`}
                              content={
                                <>
                                  <FormField
                                    name={`guestUsers.${index}.first_name`}
                                    label="First Name"
                                    required
                                  />
                                  <FormField
                                    name={`guestUsers.${index}.last_name`}
                                    label="Last Name"
                                    required
                                  />
                                  <FormField
                                    name={`guestUsers.${index}.email`}
                                    label="Email"
                                    required
                                  />
                                  <Button
                                    type="primary"
                                    attr="submit"
                                    className={styles['remove-button']}
                                    isLoading={loading}
                                    disabled={!isValid}
                                  >
                                    Add
                                  </Button>
                                  <Button
                                    type="secondary"
                                    onClick={() => remove(index)}
                                    className={styles['remove-button']}
                                    disabled={loading}
                                  >
                                    Remove
                                  </Button>
                                </>
                              }
                            />
                          ))}

                        {/* Button to add a new guest user */}
                        <Button
                          type="secondary"
                          onClick={() =>
                            push({ first_name: '', last_name: '', email: '' })
                          }
                          iconNameBefore="add"
                          className={styles['button-full']}
                        >
                          Add Guest Member
                        </Button>
                      </>
                    )}
                  </FieldArray>
                </Form>
              );
            }}
          </Formik>
        </>
      )}
    </div>
  );
};

export default DataFilesManageProjectModalAddon;
