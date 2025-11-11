import React, { useEffect, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Section, Button, LoadingSpinner } from '_common';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { MLACitation, APACitation } from '../DataFilesProjectPublish/DataFilesProjectPublishWizardSteps/ReviewAuthors';
import * as ROUTES from '../../../../constants/routes';
import { Link } from 'react-router-dom';
import NameWithDesc from '../utils/NameWithDesc/NameWithDesc';
import { formatLabel, getTooltipDescription } from '../utils/utils';
import styles from './PublishedDatasetDetail.module.css';
import { EXCLUDED_METADATA_FIELDS } from '../constants/metadataFields';

const BASE_ASSET_URL = 'https://web.corral.tacc.utexas.edu/digitalporousmedia';

function formatPublicationLink(link) {
    if (!link) return null;

    const doiPattern = /^10\.\d+\/.+$/;

    if (doiPattern.test(link)) {
        return `https://doi.org/${link}`;
    }

    return link;
}

function TreeNode({ node, system }) {
    const hasChildren = node.children && node.children.length > 0;

    const nodeNameWithDesc = (
        <NameWithDesc desc={getTooltipDescription(node.name.split('.').pop())}>
            {formatLabel(node.name.split('.').pop())}
        </NameWithDesc>
    );

    return (
        <>
            {node.metadata && node.metadata.data_type === 'sample' ? (
                <li className="data-tree__item">
                    <details>
                        <summary className="u-summary-with-a-link">
                            <a className="u-title-needs-colon">
                                <span>{nodeNameWithDesc}</span>
                                <strong>{' '}{formatLabel(node.label)}</strong>
                            </a>
                        </summary>   
                        <p>{node.metadata?.description}</p>
                        <table className="c-data-list c-data-list--is-vert c-data-list--is-narrow c-data-list--should-truncate-values">
                            <tbody>
                                {Object.entries(node.metadata).map(([key, value]) => {
                                    if (EXCLUDED_METADATA_FIELDS.includes(key)) return null;

                                    // TODO: Add description to key if needed by PI
                                    // const keyNameWithDesc = (
                                    //     <NameWithDesc desc="SAMPLE KEY DESCRIPTION">{formatLabel(key)}</NameWithDesc>
                                    // );

                                    return (
                                        <tr key={key}>
                                            <th className="c-data-list__key">{formatLabel(key)}</th>
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
                        <span>{formatLabel(node.name.split('.').pop())}</span>
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
                    <header className={'o-section project-title header'}>
                        <h1>
                            <span>{metadata.title}</span>
                            <div className="dropdown project-download-button header__action">
                                <button
                                    className="dropdown-toggle c-button c-button--primary"
                                    data-bs-toggle="dropdown"
                                    type="button"
                                >
                                    <i
                                        className="icon icon-download c-button__icon--before"
                                    >
                                    ↓
                                    </i>{' '}
                                    Download
                                </button>
                                <menu className="dropdown-menu" style={{ fontSize: '14px', textTransform: 'none' }}>
                                   <li>
                                      <a className="dropdown-item" target="_blank" href={`${BASE_ASSET_URL}/archive/${projectId}/${projectId}_archive.zip`} rel="noreferrer">
                                          Download Dataset{' '}
                                      </a>
                                   </li>
                                   <li>
                                      <a className="dropdown-item" target="_blank" href={`${BASE_ASSET_URL}/archive/${projectId}/${projectId}_metadata.json`} rel="noreferrer">
                                          Download Metadata{' '}
                                      </a>
                                   </li>
                               </menu>
                            </div>
                        </h1>
                    </header>
                    <div className={'o-section o-section--style-muted proj dect-citation'}>
                        <h3>Cite This Dataset</h3>
                        <p>
                            <APACitation project={metadata} authors={metadata.authors} />
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
                                    <a href={imageUrl} target="_blank" rel="noreferrer">
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
                                                {metadata.authors[0].first_name} {metadata.authors[0].last_name} {metadata.institution ? `(${metadata.institution})` : ''}
                                            </td>
                                        </tr>
                                        {metadata.authors.length > 1 && (
                                            <tr>
                                                <th className={'c-data-list__key'}>
                                                    Collaborators
                                                </th>
                                                <td className={'c-data-list__value'}>
                                                    {metadata.authors.slice(1).map((author, index) => (
                                                        <>
                                                            {index > 0 && <br />}
                                                            {`${author.first_name} ${author.last_name}`}
                                                        </>
                                                    ))}
                                                </td>
                                            </tr>
                                        )}
                                        <tr>
                                            <th className={'c-data-list__key'}>
                                                Published
                                            </th>
                                            <td className={'c-data-list__value'}>
                                                {new Date(metadata.publication_date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th className={'c-data-list__key'}>
                                                License
                                            </th>
                                            <td className={'c-data-list__value'}>
                                                {metadata.license}
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
                                        {metadata.keywords && (
                                            <tr>
                                                <th className={'c-data-list__key'}>
                                                    Keywords
                                                </th>
                                                <td className={'c-data-list__value'}>
                                                    {metadata.keywords}
                                                </td>
                                            </tr>
                                        )}
                                        {metadata.related_publications && metadata.related_publications.length > 0 && (
                                            <tr>
                                                <th className={'c-data-list__key'}>
                                                    Related Publications
                                                </th>
                                                <td className={'c-data-list__value'}>
                                                    {metadata.related_publications.map((publication, index) => (
                                                        <>
                                                            {index > 0 && <br />}
                                                            <a href={formatPublicationLink(publication.publication_link)} target="_blank" rel="noreferrer">{publication.publication_title}</a>
                                                        </>
                                                    ))}
                                                </td>
                                            </tr>
                                        )}
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