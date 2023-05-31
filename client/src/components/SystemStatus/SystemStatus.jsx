import React, { useEffect, useState } from 'react';
import {
  Route,
  Switch,
  Redirect,
  useRouteMatch,
  useHistory,
} from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import queryString from 'query-string';

import { LoadingSpinner, Section, SectionTableWrapper } from '_common';
import * as ROUTES from '../../constants/routes';
import { Sidebar, SectionMessage } from '_common';

import './SystemStatus.global.css';

import { SystemStatusQueueTable } from './SystemStatusQueueTable/SystemStatusQueueTable';

import styles from './SystemStatus.module.scss';

const root = `${ROUTES.WORKBENCH}${ROUTES.SYSTEM_STATUS}`;

const SystemStatusSidebar = ({ systemList }) => {
  var sidebarItems = [];

  systemList.forEach((system) => {
    sidebarItems.push({
      to: `${root}/${system.hostname}`,
      label: `${system.display_name}`,
      disabled: false,
      hidden: false,
      iconName: '',
    });
  });

  return <Sidebar sidebarItems={sidebarItems} />;
};

const Layout = ({ hostname }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({ type: 'GET_SYSTEM_MONITOR' });
  }, [dispatch]);

  const {
    loading,
    error: loadingError,
    list: systemList,
  } = useSelector((state) => state.systemMonitor);

  const selectedSystem = systemList.find((sys) => sys.hostname === hostname);

  if (loadingError) {
    return (
      <Section className={styles['no-results-message']}>
        <SectionMessage type="info">
          Unable to gather system information
        </SectionMessage>
      </Section>
    );
  }
  if (loading) {
    return <LoadingSpinner />;
  } else {
    return (
      <Section
        bodyClassName="has-loaded-system-status"
        messageComponentName="SYSTEM STATUS"
        header={`System Status / ${selectedSystem?.display_name}`}
        content={
          <>
            <SystemStatusSidebar systemList={systemList}></SystemStatusSidebar>
            <SectionTableWrapper
              className={styles['content']}
              header={`${selectedSystem?.display_name} Queues`}
              contentShouldScroll
            >
              <SystemStatusQueueTable
                system={selectedSystem}
              ></SystemStatusQueueTable>
            </SectionTableWrapper>
          </>
        }
      />
    );
  }
};

const DefaultSystemRedirect = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({ type: 'GET_SYSTEM_MONITOR' });
  }, [dispatch]);

  const systemList = useSelector((state) => state.systemMonitor.list);

  const history = useHistory();
  useEffect(() => {
    if (systemList.length === 0) return;
    const defaultSystem = systemList[0];
    history.push(`/workbench/system-status/${defaultSystem.hostname}`);
  }, [systemList]);
  return <></>;
};

const Routes = () => {
  return (
    <Switch>
      <Route
        path={`${root}/:hostname`}
        render={({ match: { params } }) => {
          return <Layout hostname={params.hostname} />;
        }}
      />
      <Route path={`${root}`}>
        <DefaultSystemRedirect />
      </Route>
    </Switch>
  );
};

export default Routes;
