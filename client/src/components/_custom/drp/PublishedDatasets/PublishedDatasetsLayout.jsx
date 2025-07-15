import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import CMSWrapper from '_common/CMSWrapper';
import styles from './PublishedDatasetsLayout.module.css';
import './PublishedDatasetsLayout.global.css';
import PublishedDatasetBreadcrumbs from './PublishedDatasetBreadcrumbs';

function PublishedDatasetsLayout({ children, params }) {

    return (
        <CMSWrapper>
            <PublishedDatasetBreadcrumbs params={params} />
            <div className={styles.content}>
                {children}
            </div>
        </CMSWrapper>
    );
}

PublishedDatasetsLayout.propTypes = {
    children: PropTypes.node.isRequired,
    params: PropTypes.object.isRequired,
};

PublishedDatasetsLayout.defaultProps = {
    params: {},
};

export default PublishedDatasetsLayout; 