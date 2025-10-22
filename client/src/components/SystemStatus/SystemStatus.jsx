import React, { useEffect } from 'react';
import { Route, Switch, Link, useHistory, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import { LoadingSpinner, Section, SectionTableWrapper } from '_common';
import * as ROUTES from '../../constants/routes';
import { Sidebar, SectionMessage } from '_common';
import Sysmon from '../SystemMonitor';
import { SystemStatusQueueTable } from './SystemStatusQueueTable/SystemStatusQueueTable';

import './SystemStatus.global.css';
import styles from './SystemStatus.module.css';

const root = `${ROUTES.WORKBENCH}${ROUTES.SYSTEM_STATUS}`;

const SystemStatusSidebar = ({ systemList }) => {
  var sidebarItems = [];

  systemList.forEach((system) => {
    sidebarItems.push({
      to: `${root}/${system.hostname}`,
      label: `${system.display_name}`,
      disabled: false,
      hidden: false,
    });
  });

  return <Sidebar sidebarItems={sidebarItems} />;
};

const Layout = ({ hostname }) => {
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

  return (
    <>
      <Section
        className={styles['root']}
        contentLayoutName="twoColumn"
        contentClassName={styles['layout']}
        content={
          <div className={styles['panel-1']}>
            <Sysmon system={selectedSystem?.hostname} />
            {loading ? (
              <LoadingSpinner />
            ) : (
              <SectionTableWrapper contentShouldScroll>
                <SystemStatusQueueTable system={selectedSystem} />
              </SectionTableWrapper>
            )}
          </div>
        }
        /* For Average Wait Times table, add a second <div> */
      />
    </>
  );
};

const DefaultSystemRedirect = () => {
  const systemList = useSelector((state) => state.systemMonitor.list);

  const history = useHistory();
  useEffect(() => {
    if (systemList.length === 0) return;
    const defaultSystem =
      systemList.find((sys) => sys.display_name === 'Frontera') ??
      systemList[0];
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

const SystemStatus = () => {
  const { list: systemList } = useSelector((state) => state.systemMonitor);

  const dispatch = useDispatch();

  useEffect(() => {
    if (systemList.length == 0) {
      dispatch({ type: 'GET_SYSTEM_MONITOR' });
    }
  }, [dispatch]);

  const location = useLocation();

  const hostname = location.pathname.split('/')[3];

  const selectedSystem = systemList.find((sys) => sys.hostname === hostname);

  const displayName = selectedSystem?.display_name;

  return (
    <Section
      bodyClassName="has-loaded-system-status"
      messageComponentName="SYSTEM STATUS"
      header={`System Status ${displayName ? '/ ' + displayName : ''}`}
      contentLayoutName="hasSidebar"
      content={
        <>
          <SystemStatusSidebar systemList={systemList}></SystemStatusSidebar>
          <Routes></Routes>
        </>
      }
    />
  );
};

export default SystemStatus;
