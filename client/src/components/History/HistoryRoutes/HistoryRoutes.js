import React, { memo } from 'react';
import { Route, Switch, Redirect, useRouteMatch } from 'react-router-dom';
import { Layout, Sidebar, Header } from '../HistoryLayout';

import JobHistory from '../HistoryLayouts';
import * as ROUTES from '../../../constants/routes';
import './HistoryRoutes.module.scss';

const HistoryRoutes = () => {
  const root = `${ROUTES.WORKBENCH}${ROUTES.HISTORY}`;
  const match = useRouteMatch(`${root}/:historyType`);
  const historyType = match
    ? match.params.historyType.substring(0, 1).toUpperCase() +
      match.params.historyType.substring(1).toLowerCase()
    : '';
  const { path } = useRouteMatch();
  return (
    <div styleName="root" data-testid="history-router">
      <Header title={historyType} />
      <div styleName="container">
        <Sidebar root={root} />
        <div styleName="content">
          <Switch>
            <Route exact path={`${root}/jobs`}>
              <JobHistory />
            </Route>
            <Route exact path={`${root}/uploads`}>
              <Layout page="uploads" />
            </Route>
            <Route exact path={`${root}/files`}>
              <Layout page="files" />
            </Route>
            {/* Redirect from /workbench/history to /workbench/history/jobs */}
            <Redirect from={root} to={`${root}/jobs`} />
            {/* Redirect from an unmatched path in /workbench/history/* to /workbench/history/jobs */}
            <Redirect from={path} to={`${root}/jobs`} />
          </Switch>
        </div>
      </div>
    </div>
  );
};

export default memo(HistoryRoutes);
