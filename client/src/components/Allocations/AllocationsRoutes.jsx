import React, { useEffect, memo } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Layout } from './AllocationsLayout';
import * as ROUTES from '../../constants/routes';
import './Allocations.scss';

const AllocationsRoutes = () => {
  const root = `${ROUTES.WORKBENCH}${ROUTES.ALLOCATIONS}`;
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({ type: 'GET_ALLOCATIONS' });
  }, [dispatch]);
  return (
    <Switch>
      <Route path={`${root}/approved`}>
        <Layout page="approved" />
      </Route>
      <Route path={`${root}/expired`}>
        <Layout page="expired" />
      </Route>
      <Redirect from={`${root}/manage`} to={`${root}/approved/manage`} />
      <Redirect from={root} to={`${root}/approved`} />
    </Switch>
  );
};

export default memo(AllocationsRoutes);
