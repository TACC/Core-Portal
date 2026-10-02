import React, { useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { LoadingSpinner } from '_common';
import { useSystems, useTapisToken } from 'hooks/datafiles';
import Dashboard from '../Dashboard';
import TicketCreateModal from '../Tickets/TicketCreateModal';
import ManageAccount from '../ManageAccount';
import Allocations from '../Allocations';
import Applications from '../Applications';
import UIPatterns from '../UIPatterns';
import WorkbenchSidebar from './WorkbenchSidebar';
import DataFiles from '../DataFiles';
import Submissions from '../Submissions';
import History from '../History';
import Onboarding from '../Onboarding';
import * as ROUTES from '../../constants/routes';
import NotificationToast from '../Toasts';
import OnboardingAdmin from '../Onboarding/OnboardingAdmin';
import SystemStatus from '../SystemStatus';
import './Workbench.scss';
// Core Styles needs to be imported last for Rollup to compile the CSS correctly.
import '../../index.css';
import { useRedirectOnSessionExpired } from 'hooks/auth';

function Workbench() {
  const dispatch = useDispatch();
  const { loading: loadingSystems } = useSystems();

  // Prefetch the user's Tapis token so it's ready to go when the user tries to upload files
  useTapisToken();
  // Get the time remaining in the user's session and redirect to the homepage if their
  // browser is open when it expires.
  useRedirectOnSessionExpired({ location: '/' });

  // showUIPatterns: Show some entries only in local development
  const {
    loading,
    setupComplete,
    showUIPatterns,
    isStaff,
    hideApps,
    hideDataFiles,
    hideAllocations,
    showSubmissions,
    hideManageAccount,
    hideSystemStatus,
    hideOnboarding,
    isTACCPortal,
  } = useSelector(
    (state) => ({
      loading: state.workbench.loading || loadingSystems,
      setupComplete: state.workbench.setupComplete,
      showUIPatterns: state.workbench.config.debug,
      isStaff:
        state.authenticatedUser.user && state.authenticatedUser.user.isStaff,
      hideApps: state.workbench.config.hideApps,
      hideDataFiles: state.workbench.config.hideDataFiles,
      hideAllocations: state.workbench.config.hideAllocations,
      showSubmissions: state.workbench.config.showSubmissions,
      hideManageAccount: state.workbench.config.hideManageAccount,
      hideSystemStatus: state.workbench.config.hideSystemStatus,
      hideOnboarding: state.workbench.config.hideOnboarding,
      isTACCPortal: state.workbench.isTACCPortal,
    }),
    shallowEqual
  );

  // Get systems and any other initial data we need from the backend
  useEffect(() => {
    dispatch({
      type: 'FETCH_NOTIFICATIONS',
      payload: {
        body: {
          eventTypes: ['job', 'interactive_session_ready'],
        },
      },
    });

    if (setupComplete) {
      if (isTACCPortal) {
        dispatch({ type: 'GET_ALLOCATIONS' });
      }
      dispatch({ type: 'GET_APPS' });
      dispatch({ type: 'GET_APP_START' });
      dispatch({ type: 'GET_JOBS', params: { offset: 0 } });
    }
  }, [setupComplete, isTACCPortal, dispatch]);

  return (
    <div className="workbench-wrapper">
      <NotificationToast />
      <WorkbenchSidebar
        disabled={!setupComplete}
        showUIPatterns={showUIPatterns}
        loading={loading}
      />
      <div className="workbench-content">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {setupComplete ? (
              <Routes>
                <Route path={`${ROUTES.DASHBOARD}/*`} element={<Dashboard />} />
                {!hideManageAccount && (
                  <Route
                    path={`${ROUTES.ACCOUNT}`}
                    element={<ManageAccount />}
                  />
                )}
                {!hideDataFiles && (
                  <Route path={`${ROUTES.DATA}/*`} element={<DataFiles />} />
                )}
                {!hideApps && (
                  <Route
                    path={`${ROUTES.APPLICATIONS}/*`}
                    element={<Applications />}
                  />
                )}
                {!hideAllocations && (
                  <Route
                    path={`${ROUTES.ALLOCATIONS}/*`}
                    element={<Allocations />}
                  />
                )}
                {showSubmissions && (
                  <Route
                    path={`${ROUTES.SUBMISSIONS}`}
                    element={<Submissions />}
                  />
                )}
                {!hideApps && (
                  <Route path={`${ROUTES.HISTORY}/*`} element={<History />} />
                )}
                {!hideOnboarding && (
                  <Route
                    path={`${ROUTES.ONBOARDING}/*`}
                    element={<Onboarding />}
                  />
                )}
                {isStaff && !hideOnboarding && (
                  <Route
                    path={`${ROUTES.ONBOARDINGADMIN}`}
                    element={<OnboardingAdmin />}
                  />
                )}
                {!hideSystemStatus && (
                  <Route
                    path={`${ROUTES.SYSTEM_STATUS}/*`}
                    element={<SystemStatus />}
                  />
                )}
                {showUIPatterns && (
                  <Route path={`${ROUTES.UI}`} element={<UIPatterns />} />
                )}
                <Route
                  path="*"
                  element={
                    <Navigate
                      to={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}`}
                      replace
                    />
                  }
                />
              </Routes>
            ) : (
              <Routes>
                <Route
                  path={`${ROUTES.ONBOARDING}/*`}
                  element={<Onboarding />}
                />
                <Route
                  path="*"
                  element={
                    <Navigate
                      to={`${ROUTES.WORKBENCH}${ROUTES.ONBOARDING}/setup/`}
                      replace
                    />
                  }
                />
              </Routes>
            )}
          </>
        )}
      </div>
      <TicketCreateModal /* Top level modals */ />
    </div>
  );
}

export default Workbench;
