import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import CMSWrapper from '_common/CMSWrapper';
import './PublishedDatasetsLayout.global.css';
import PublishedDatasetBreadcrumbs from './PublishedDatasetBreadcrumbs';

function PublishedDatasetsLayout({ children, params }) {

    return (
        <CMSWrapper>
            <PublishedDatasetBreadcrumbs params={params} />
            {children}
        </CMSWrapper>
    );
}

PublishedDatasetsLayout.propTypes = {
    children: PropTypes.node.isRequired,
    params: PropTypes.object.isRequired,
};

export default PublishedDatasetsLayout; 