import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import CMSBreadcrumbs from '_common/CMSBreadcrumbs';
import * as ROUTES from '../../../../constants/routes';
import { findNodeInTree } from '../utils/utils';

const PublishedDatasetBreadcrumbs = ({ params }) => {
  
  const dispatch = useDispatch();
  const portalName = useSelector((state) => state.workbench.portalName);
  const { value: tree, loading: treeLoading } = useSelector((state) => state.publications.tree);
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  useEffect(() => {
    if (params?.system) {
      if (!tree && !treeLoading && portalName) {
        dispatch({
          type: 'PUBLICATIONS_GET_TREE',
          payload: { portalName, system: params.system },
        });
      }
    }
  }, [params, tree, treeLoading, portalName, dispatch]);

  useEffect(() => {
    const buildBreadcrumbs = () => {
      const crumbs = [
        { name: "Browse Datasets", href: ROUTES.PUBLICATIONS }
      ];

      if (params?.page_type === 'datasetDetail') {
        crumbs.push({ name: tree.label });
      }
      
      if (params?.page_type === 'entityDetail') {
        crumbs.push({ 
          name: tree.label, 
          href: `${ROUTES.PUBLICATIONS}/${params.system}` 
        });
        crumbs.push({ 
          name: findNodeInTree(tree, params.entity_id)?.label || 'Entity'
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
