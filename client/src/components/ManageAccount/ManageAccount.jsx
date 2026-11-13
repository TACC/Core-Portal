import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';

import { LoadingSpinner, Section, SectionMessage } from '_common';
import {
  ProfileInformation,
  PasswordInformation,
  Licenses,
  Integrations,
} from './ManageAccountTables';

import './ManageAccount.scss';
import './ManageAccount.global.css';
import styles from './ManageAccount.module.css';
import { INTEGRATION_SETUP_ERROR } from '../../constants/messages';
import { useWorkbenchConfig } from '@tacc/core-hooks';
import { useQuery } from '@tanstack/react-query';
import { profileQueries } from '@tacc/core-queries';

const ManageAccountView = () => {
  const {
    data: {
      config: { hideApps, hideDataFiles },
    },
  } = useWorkbenchConfig();

  const {
    data: profileData,
    isLoading,
    isError,
  } = useQuery(profileQueries.getProfile());

  return (
    <Section
      bodyClassName="has-loaded-account"
      messageComponentName="ACCOUNT"
      header="Manage Account"
      messages={[
        !isLoading && isError && (
          <div>
            <SectionMessage type="error">
              An error occurred loading your account information.
            </SectionMessage>
          </div>
        ),
        !!profileData &&
          profileData.integrations.map(
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
          !!profileData && (
            <Suspense>
              <ProfileInformation />
              {!hideApps && (profileData?.licenses ?? []).length > 0 && (
                <Licenses />
              )}
              {!hideDataFiles &&
                (profileData?.integrations ?? []).length > 0 && (
                  <Integrations />
                )}
              <PasswordInformation />
            </Suspense>
          )
        )
      }
      contentClassName={styles.panels}
      contentLayoutName={isLoading ? `oneColumn` : `multiColumn`}
      contentShouldScroll
    />
  );
};

export default React.memo(ManageAccountView);
