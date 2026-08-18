import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import CMSBreadcrumbs from '_common/CMSBreadcrumbs';
import * as ROUTES from '../../../../constants/routes';
import { findNodeInTreeById } from 'utils/tree';
import { useProjectTree } from 'hooks/datafiles';

const PublishedDatasetBreadcrumbs = ({ params }) => {
  const { data, isLoading: treeLoading } = useProjectTree(params?.system);
  const tree = data?.[0];
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  useEffect(() => {
    const buildBreadcrumbs = () => {
      const crumbs = [{ name: 'Browse Datasets', href: ROUTES.PUBLICATIONS }];

      if (params?.page_type === 'datasetDetail') {
        crumbs.push({ name: tree.label });
      }

      if (params?.page_type === 'entityDetail') {
        crumbs.push({
          name: tree.label,
          href: `${ROUTES.PUBLICATIONS}/${params.system}`,
        });
        crumbs.push({
          name: findNodeInTreeById(tree, params.entity_id)?.label || 'Entity',
        });
      }

      setBreadcrumbs(crumbs);
    };

    if (params && tree && !treeLoading) {
      buildBreadcrumbs();
    }
  }, [params, tree, treeLoading]);

  return <CMSBreadcrumbs breadcrumbs={breadcrumbs} />;
};

PublishedDatasetBreadcrumbs.propTypes = {
  params: PropTypes.shape({
    system: PropTypes.string,
    page_type: PropTypes.string,
    entity_id: PropTypes.string,
  }),
};

export default PublishedDatasetBreadcrumbs;
