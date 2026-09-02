import React from 'react';
import { Route } from 'react-router-dom';
import * as ROUTES from '../../../../constants/routes';
import {
  PublishedDatasetsBrowse,
  PublishedDatasetDetail,
  PublishedDatasetEntityDetail,
  PublishedDatasetsLayout,
} from '.';

// DRP-specific published-datasets routes
const PublishedDatasetsRoutes = () => (
  <>
    <Route
      path={ROUTES.PUBLICATIONS}
      exact
      render={() => (
        <PublishedDatasetsLayout params={{ page_type: 'browse' }}>
          <PublishedDatasetsBrowse />
        </PublishedDatasetsLayout>
      )}
    />
    <Route
      path={`${ROUTES.PUBLICATIONS}/:system/:entity_type/:entity_id`}
      render={({ match: { params } }) => (
        <PublishedDatasetsLayout
          params={{ ...params, page_type: 'entityDetail' }}
        >
          <PublishedDatasetEntityDetail params={params} />
        </PublishedDatasetsLayout>
      )}
    />
    <Route
      path={`${ROUTES.PUBLICATIONS}/:system`}
      exact
      render={({ match: { params } }) => (
        <PublishedDatasetsLayout
          params={{ ...params, page_type: 'datasetDetail' }}
        >
          <PublishedDatasetDetail params={params} />
        </PublishedDatasetsLayout>
      )}
    />
  </>
);

export default PublishedDatasetsRoutes;
