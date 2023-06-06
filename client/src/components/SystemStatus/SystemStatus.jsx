import React, { useEffect } from 'react';
import { Route, Switch, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import { LoadingSpinner, Section, SectionTableWrapper } from '_common';
import * as ROUTES from '../../constants/routes';
import { Sidebar, SectionMessage } from '_common';
import Sysmon from '../SystemMonitor';
import { SystemStatusQueueTable } from './SystemStatusQueueTable/SystemStatusQueueTable';

import './SystemStatus.global.css';
import styles from './SystemStatus.module.scss';

const root = `${ROUTES.WORKBENCH}${ROUTES.SYSTEM_STATUS}`;

const HeaderActions = () => {
  return (
    <Link className="btn btn-primary" to={root}>
      View All Systems
    </Link>
  );
};
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
      <SectionTableWrapper
        className={styles['content']}
        header={`${selectedSystem ? selectedSystem.display_name : ''} Queues`}
        headerClassName={styles['header']}
        headerActions={<HeaderActions />}
        contentShouldScroll
      >
        <SystemStatusQueueTable system={selectedSystem} />
      </SectionTableWrapper>
    );
  }
};

const DefaultSystemRedirect = () => {
  return (
    <SectionTableWrapper
      className={styles['content']}
      header="System Monitor"
      headerClassName={styles['header']}
    >
      <Sysmon className={styles['sys-mon']}></Sysmon>
    </SectionTableWrapper>
  );
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

  return (
    <Section
      bodyClassName="has-loaded-system-status"
      messageComponentName="SYSTEM STATUS"
      header="System Status"
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
