import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Alert } from 'reactstrap';
import { isEmpty } from 'lodash';
import { LoadingSpinner, Section, SectionMessage } from '_common';
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
import { GOOGLE_DRIVE_SETUP_ERROR } from '../../constants/messages';

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
    <Section
      bodyClassName="has-loaded-account"
      introMessageName="ACCOUNT"
      header="Manage Account"
      messages={
        !isLoading &&
        integrations[0].error === 'SETUP_ERROR' && (
          <SectionMessage type="warning" canDismiss>
            {GOOGLE_DRIVE_SETUP_ERROR}
          </SectionMessage>
        )
      }
      headerActions={
        <Link to="/workbench/dashboard" className="wb-link">
          Back to Dashboard
        </Link>
      }
      content={
        isLoading ? (
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
        )
      }
      contentStyleName="panels"
      contentClassName="manage-account-content"
      contentLayoutName={isLoading ? `oneColumn` : `multiColumnUnequal`}
      contentShouldScroll
    />
  );
};

export default React.memo(ManageAccountView);
