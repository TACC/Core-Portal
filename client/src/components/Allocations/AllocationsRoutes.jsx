import React, { useEffect, memo } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
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
    <Routes>
      <Route path={`approved/*`} element={<Layout page="approved" />} />
      <Route path={`expired/*`} element={<Layout page="expired" />} />
      <Route
        path={`manage`}
        element={<Navigate to={`${root}/approved/manage`} replace />}
      />
      <Route path="*" element={<Navigate to={`${root}/approved`} replace />} />
    </Routes>
  );
};

export default memo(AllocationsRoutes);
