import React, { useEffect } from 'react';
import { Route } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { Layout } from './AllocationsLayout';
import './Allocations.scss';

const AllocationsRoutes = ({ match: { path } }) => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({ type: 'GET_ALLOCATIONS' });
  }, [dispatch]);

  return (
    <div id="allocations-wrapper" data-testid="allocations-router">
      <Route exact path={[`${path}`, `${path}/approved`]}>
        <Layout filter="Approved" />
      </Route>
      <Route path={`${path}/pending`}>
        <Layout filter="Pending" />
      </Route>
      <Route path={`${path}/expired`}>
        <Layout filter="Expired" />
      </Route>
    </div>
  );
};
AllocationsRoutes.propTypes = {
  match: PropTypes.instanceOf(Object)
};
AllocationsRoutes.defaultProps = {
  match: {
    path: 'workbench'
  }
};

export default AllocationsRoutes;
