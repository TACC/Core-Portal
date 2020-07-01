import React, { memo } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import { Layout } from './HistoryLayout';
import * as ROUTES from '../../constants/routes';
import './History.module.scss';

const HistoryRoutes = () => {
  const root = `${ROUTES.WORKBENCH}${ROUTES.HISTORY}`;
  return (
    <div styleName="history-wrapper" data-testid="history-router">
      <Switch>
        <Route exact path={`${root}/jobs`}>
          <Layout page="jobs" />
        </Route>
        <Route exact path={`${root}/uploads`}>
          <Layout page="uploads" />
        </Route>
        <Route exact path={`${root}/files`}>
          <Layout page="files" />
        </Route>
        <Redirect from={root} to={`${root}/jobs`} />
      </Switch>
    </div>
  );
};

export default memo(HistoryRoutes);
