import React, { useEffect, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Section, Button, LoadingSpinner } from '_common';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { MLACitation } from '../DataFilesProjectPublish/DataFilesProjectPublishWizardSteps/ReviewAuthors';
import * as ROUTES from '../../../../constants/routes';
import { Link } from 'react-router-dom';
import { formatLabel } from '../utils/utils';
import styles from './PublishedDatasetDetail.module.css';

const BASE_ASSET_URL = 'https://web.corral.tacc.utexas.edu/digitalporousmedia';

const excludedEntityMetadataFields = [
    'name',
    'description',
    'data_type',
    'sample',
    'digital_dataset',
    'file_objs',
    'cover_image',
    'file_url',
  ];

function TreeNode({ node, system }) {
    const hasChildren = node.children && node.children.length > 0;

    const nameText = node.name.split('.').pop();
    const nameDesc = "SAMPLE NAME DESCRIPTION";
    const nameMarkup = nameDesc ? <abbr title={nameDesc}>{nameText}</abbr> : nameText;

    return (
        <>
            {node.metadata && node.metadata.data_type === 'sample' ? (
                <li className="data-tree__item">
                    <details>
                        <summary className="u-summary-with-a-link">
                            <a className="u-title-needs-colon">
                                <span>{nameMarkup}</span>
                                <strong>{' '}{formatLabel(node.label)}</strong>
                            </a>
                        </summary>   
                        <p>{node.metadata?.description}</p>
                        <table className="c-data-list c-data-list--is-vert c-data-list--is-narrow c-data-list--should-truncate-values">
                            <tbody>
                                {Object.entries(node.metadata).map(([key, value]) => {
                                    if (excludedEntityMetadataFields.includes(key)) return null;

                                    const keyText = formatLabel(key);
                                    const keyDesc = "SAMPLE KEY DESCRIPTION";
                                    const keyMarkup = keyDesc ? <abbr title={keyDesc}>{keyText}</abbr> : keyText;

                                    return (
                                        <tr key={key}>
                                            <th className="c-data-list__key">{keyMarkup}</th>
                                        <td className="c-data-list__value">
                                            {formatLabel(value)}
                                        </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </details>
                </li>
            ) : (
                <li>
                    <Link className="u-title-needs-colon" to={`${ROUTES.PUBLICATIONS}/${system}/${node.name.split('.').pop()}/${node.uuid}`}>
                        <span>{nameMarkup}</span>
                        <strong>{' '}{formatLabel(node.label)}</strong>
                    </Link>
                </li>
            )}
            {hasChildren && (
                <ul>
                    {node.children.map((child) => (
                        <TreeNode key={child.id} node={child} system={system} />
                    ))}
                </ul>
            )}
        </>
    );
}

function PublishedDatasetDetail({ params }) {

    const dispatch = useDispatch();

    const { system } = params;
    const [projectId, setProjectId] = useState(null);
    const portalName = useSelector((state) => state.workbench.portalName);
    const { value: tree, loading, error } = useSelector((state) => state.publications.tree);
    const metadata = useSelector((state) => state.projects.metadata);
    const imageUrl = `${BASE_ASSET_URL}/${metadata.cover_image}`;

    useEffect(() => {
        dispatch({
          type: 'PROJECTS_GET_METADATA',
          payload: system,
        });
        setProjectId(system.split('.').pop());
    }, [system]);

    useEffect(() => {
        if (system && portalName) {
            dispatch({
                type: 'PUBLICATIONS_GET_TREE',
                payload: { portalName, system },
            });
        }
    }, [system, portalName]);

    return (
        <div className={'container'}>
            {(metadata.loading || loading || !metadata.title) ? (
                <LoadingSpinner />
            ) : (metadata.error || error) ? (
                <div className="alert alert-danger">
                    Error loading data. Please try again.
                </div>
            ) : (
                <>
                    <div className={'o-section project-title'}>
                        <h1>
                            <span>{metadata.title}</span>
                            <a
                                className="c-button c-button--primary project-download-button"
                                href={`${BASE_ASSET_URL}/archive/${projectId}/${projectId}_archive.zip`}
                            >
                                <i
                                    className="icon icon-download c-button__icon--before"
                                >
                                ↓
                                </i>{' '}
                                Download Dataset
                            </a>
                        </h1>
                    </div>
                    <div className={'o-section o-section--style-muted project-citation'}>
                        <h3>Cite This Dataset</h3>
                        <p>
                            <MLACitation project={metadata} authors={metadata.authors} />
                        </p>
                        <p>
                            <strong>Download Citation:</strong>{' '}
                            <a
                                href={`https://commons.datacite.org/doi.org/${metadata.doi}`}
                                rel="noreferrer"
                                target="_blank"
                            >
                                Other Formats
                            </a>
                        </p>
                    </div>
                    <div className={'o-section o-section--style-light'}>
                        <div className={'row project-overview'}>
                            <div className={'col col-12 col-sm-12 col-md-3 col-lg-3 col-xl-3'}>
                                {metadata.cover_image && (
                                    <a href={imageUrl} target="_blank">
                                        <img src={imageUrl} alt={metadata.title} className={`align-left img-fluid ${styles.image}`} />
                                    </a>
                                )}
                            </div>
                            <div className={'col project-desc'}>
                                <p>{metadata.description}</p>
                                <table className={'c-data-list c-data-list--is-vert c-data-list--is-narrow'}>
                                    <tbody>
                                        <tr>
                                            <th className={'c-data-list__key'}>
                                                Author
                                            </th>
                                            <td className={'c-data-list__value'}>
                                                {metadata.authors[0].first_name} {metadata.authors[0].last_name}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th className={'c-data-list__key'}>
                                                Created
                                            </th>
                                            <td className={'c-data-list__value'}>
                                                {metadata.created}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th className={'c-data-list__key'}>
                                                Digital Object Identifier
                                            </th>
                                            <td className={'c-data-list__value'}>
                                                {metadata.doi}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className={'project-content'}>
                            <div id="files">
                                <h3>Files and Metadata</h3>
                                {tree?.children?.length > 0 ? (
                                    <ul className="data-tree">
                                        {tree.children.map((child, index) => (
                                            <TreeNode key={child.id} node={child} system={system} />
                                        ))}
                                    </ul>
                                ) : (
                                    <p>No files available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default PublishedDatasetDetail;