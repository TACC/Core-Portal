import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import * as ROUTES from '../../../../constants/routes';
import {
  PublishedDatasetsBrowse,
  PublishedDatasetDetail,
  PublishedDatasetEntityDetail,
  PublishedDatasetsLayout,
} from '.';

const PublishedDatasetEntityDetailRoute = () => {
  const params = useParams();
  return (
    <PublishedDatasetsLayout params={{ ...params, page_type: 'entityDetail' }}>
      <PublishedDatasetEntityDetail params={params} />
    </PublishedDatasetsLayout>
  );
};

const PublishedDatasetDetailRoute = () => {
  const params = useParams();
  return (
    <PublishedDatasetsLayout params={{ ...params, page_type: 'datasetDetail' }}>
      <PublishedDatasetDetail params={params} />
    </PublishedDatasetsLayout>
  );
};

// DRP-specific published-datasets routes
const PublishedDatasetsRoutes = () => (
  <Routes>
    <Route
      path={ROUTES.PUBLICATIONS}
      element={
        <PublishedDatasetsLayout params={{ page_type: 'browse' }}>
          <PublishedDatasetsBrowse />
        </PublishedDatasetsLayout>
      }
    />
    <Route
      path={`${ROUTES.PUBLICATIONS}/:system/:entity_type/:entity_id`}
      element={<PublishedDatasetEntityDetailRoute />}
    />
    <Route
      path={`${ROUTES.PUBLICATIONS}/:system`}
      element={<PublishedDatasetDetailRoute />}
    />
  </Routes>
);

export default PublishedDatasetsRoutes;
