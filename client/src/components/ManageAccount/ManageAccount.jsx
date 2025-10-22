import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { isEmpty } from 'lodash';
import { LoadingSpinner, Section, SectionMessage } from '_common';
import {
  ProfileInformation,
  PasswordInformation,
  Licenses,
  Integrations,
} from './ManageAccountTables';

import './ManageAccount.css';
import './ManageAccount.global.css';
import styles from './ManageAccount.module.css';
import { INTEGRATION_SETUP_ERROR } from '../../constants/messages';

const ManageAccountView = () => {
  const {
    config: { hideApps, hideDataFiles },
    profile: {
      isLoading,
      errors,
      data: { licenses, integrations },
    },
  } = useSelector(
    (state) => ({
      config: state.workbench.config,
      profile: state.profile,
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
      messageComponentName="ACCOUNT"
      header="Manage Account"
      messages={[
        !isLoading && errors.data && (
          <div>
            <SectionMessage type="error">
              An error occurred loading your account information.
            </SectionMessage>
          </div>
        ),
        !isLoading &&
          integrations.map(
            (integration) =>
              integration &&
              integration.error === 'SETUP_ERROR' && (
                <SectionMessage
                  key={integration.label}
                  type="warning"
                  canDismiss
                >
                  {INTEGRATION_SETUP_ERROR(integration.label)}
                </SectionMessage>
              )
          ),
      ]}
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
            <ProfileInformation />
            {!hideApps && !isEmpty(licenses) && <Licenses />}
            {!hideDataFiles && !isEmpty(integrations) && <Integrations />}
            <PasswordInformation />
          </>
        )
      }
      contentClassName={styles.panels}
      contentLayoutName={isLoading ? `oneColumn` : `multiColumn`}
      contentShouldScroll
    />
  );
};

export default React.memo(ManageAccountView);
