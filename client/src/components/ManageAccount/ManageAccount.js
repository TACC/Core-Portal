import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Alert } from 'reactstrap';
import { isEmpty } from 'lodash';
import { LoadingSpinner, Section } from '_common';
import {
  RequiredInformation,
  ChangePassword,
  Licenses,
  OptionalInformation,
  Integrations
} from './ManageAccountTables';
import {
  ChangePasswordModal,
  EditOptionalInformationModal,
  EditRequiredInformationModal
} from './ManageAccountModals';

import './ManageAccount.scss';
import './ManageAccount.global.css';
import './ManageAccount.module.css';

const ManageAccountView = () => {
  const {
    isLoading,
    errors,
    data: { licenses, integrations }
  } = useSelector(state => state.profile);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({ type: 'GET_PROFILE_DATA' });
  }, [dispatch, isLoading]);
  return (
    /* !!!: Temporary bad indentation to make simpler PR diff */
    /* eslint-disable prettier/prettier */
    <Section
      bodyClassName="has-loaded-account"
      welcomeMessageName="ACCOUNT"
      header="Manage Account"
      headerActions={
        <Link to="/workbench/dashboard" className="wb-link">
          Back to Dashboard
        </Link>
      }
      content=
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                {errors.data && (
                  <Alert color="danger">Unable to get your profile data</Alert>
                )}
                {errors.fields && (
                  <Alert color="danger">Unable to get form fields</Alert>
                )}
                <RequiredInformation />
                <OptionalInformation />
                <ChangePasswordModal />
                <EditOptionalInformationModal />
                <EditRequiredInformationModal />
                {!isEmpty(licenses) && <Licenses />}
                {!isEmpty(integrations) && <Integrations />}
                <ChangePassword />
              </>
            )}
      contentStyleName="panels"
      contentClassName="manage-account-content"
      contentLayoutName={isLoading ? `oneColumn` : `multiColumn`}
      contentShouldScroll
    />
    /* eslint-enable prettier/prettier */
  );
};

export default React.memo(ManageAccountView);
