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
    <div id="allocations-wrapper">
      <Route
        exact
        path={[`${path}`, `${path}/approved`]}
        render={() => <Layout filter="Approved" />}
      />
      <Route
        path={`${path}/pending`}
        render={() => <Layout filter="Pending" />}
      />
      <Route
        path={`${path}/expired`}
        render={() => <Layout filter="Expired" />}
      />
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
