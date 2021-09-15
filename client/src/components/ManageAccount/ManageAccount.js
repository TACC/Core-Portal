import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
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
import { INTEGRATION_SETUP_ERROR } from '../../constants/messages';

const ManageAccountView = () => {
  const {
    config: { hideApps, hideDataFiles },
    profile: {
      isLoading,
      errors,
      data: { licenses, integrations }
    }
  } = useSelector(
    state => ({
      config: state.workbench.config,
      profile: state.profile
    }),
    shallowEqual
  );

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({ type: 'GET_PROFILE_DATA' });
  }, [dispatch]);
  return (
    <Section
      bodyClassName="has-loaded-account"
      welcomeMessageName="ACCOUNT"
      header="Manage Account"
      messages={
        !isLoading &&
        integrations.map(
          integration =>
            integration &&
            integration.error === 'SETUP_ERROR' && (
              <SectionMessage key={integration.label} type="warning" canDismiss>
                {INTEGRATION_SETUP_ERROR(integration.label)}
              </SectionMessage>
            )
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
            {!hideApps && !isEmpty(licenses) && <Licenses />}
            {!hideDataFiles && !isEmpty(integrations) && <Integrations />}
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
