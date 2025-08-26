import React, { useEffect, useCallback, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Section, Button, Paginator } from '_common';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { fetchUtil } from 'utils/fetchUtil';
import createSizeString from 'utils/sizeFormat';
import styles from './PublishedDatasetsLayout.module.css';
import NameWithDesc from '../utils/NameWithDesc/NameWithDesc';
import { formatLabel, findNodeInTree } from '../utils/utils';
const BASE_ASSET_URL = 'https://web.corral.tacc.utexas.edu/digitalporousmedia';

const excludedImageMetadataFields = ['is_advanced_image_file', 'data_type', 'name'];
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

function PublishedDatasetEntityDetail({ params }) {

    const dispatch = useDispatch();

    const { system, entity_type: entityType, entity_id: entityID } = params;
    const projectId = system.split('.').pop();

    const projectUrl = `${BASE_ASSET_URL}/${projectId}`;
    const portalName = useSelector((state) => state.workbench.portalName);

    const { value: tree, loading, error } = useSelector((state) => state.publications.tree);
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [fileGroups, setFileGroups] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    
    const itemsPerPage = 5;
    
    const paginationData = useMemo(() => {
        const totalPages = Math.ceil(fileGroups.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentFileGroups = fileGroups.slice(startIndex, endIndex);
        
        return {
            totalPages,
            startIndex,
            endIndex,
            currentFileGroups
        };
    }, [fileGroups, currentPage]);


    const groupFilesByBaseName = (files) => {
        const processedFileSuffixes = ['.thumb.jpg', '.histogram.jpg', '.histogram.csv', '.gif', '.jpg'];
    
        const groups = files.reduce((map, file) => {
            const suffix = processedFileSuffixes.find(suf => file.name.endsWith(suf));
            const baseName = suffix
                ? file.name.slice(0, -suffix.length)
                : file.name;
    
            if (!map[baseName]) {
                map[baseName] = { raw: null, processed: [] };
            }
    
            if (suffix) {
                map[baseName].processed.push(file);
            } else {
                map[baseName].raw = file;
            }
    
            return map;
        }, {});

        // Handle standalone processed files (e.g., standalone .gif files)
        // If a group has no raw file but has processed files, treat the first processed file as raw
        Object.values(groups).forEach(group => {
            if (!group.raw && group.processed.length > 0) {
                group.raw = group.processed[0];
                group.processed = group.processed.slice(1);
            }
        });

        return Object.values(groups);
    };

    useEffect(() => {
        dispatch({
            type: 'PUBLICATIONS_GET_TREE',
            payload: { portalName, system },
        });
    }, [system, portalName]);

    useEffect(() => {
        if (tree && !loading && !error && entityID) {
            const entity = findNodeInTree(tree, entityID);
            setSelectedEntity(entity);
        }
    }, [tree, loading, error, entityID]);

    useEffect(() => {
        if (selectedEntity) {
            const groups = groupFilesByBaseName(selectedEntity.fileObjs);
            console.log(groups);
            setFileGroups(groups);
            setCurrentPage(1); // Reset to first page when data changes
        }
    }, [selectedEntity]);

    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    const entityTypeWithDesc = (
        <NameWithDesc desc="SAMPLE ENTITY DESCRIPTION">
            {formatLabel(entityType)}
        </NameWithDesc>
    );

    return (
        <>
        {tree && !loading && !error && selectedEntity && (
            <>
            <section className={'o-section'}>
                    <h3 className={"u-title-needs-colon"}>
                        <span>{entityTypeWithDesc}</span>{` `}
                        <strong>{selectedEntity.label}</strong>
                    </h3>
                    <p>{selectedEntity?.description}</p>
                    <table className="c-data-list c-data-list--horizontal c-data-list--is-narrow">
                        <tbody>
                            {Object.entries(selectedEntity.metadata).map(([key, value]) => {
                                if (excludedEntityMetadataFields.includes(key)) return null;

                                const keyNameWithDesc = (
                                    <NameWithDesc desc="SAMPLE KEY DESCRIPTION">{formatLabel(key)}</NameWithDesc>
                                );

                                return (
                                    <tr key={key}>
                                        <th className="c-data-list__key">{keyNameWithDesc}</th>
                                        <td className="c-data-list__value">
                                            {formatLabel(value)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
            </section>

            <section id="data" className="o-section">
                <ul className="c-card-list">
                    {paginationData.currentFileGroups.map(({ raw, processed }) => {
                        const thumbnailFile = processed.find(file => file.name.endsWith('.thumb.jpg') || file.name.endsWith('.jpg'));
                        const gifFile = processed.find(file => file.name.endsWith('.gif'));
                        const histogramFile = processed.find(file => file.name.endsWith('.histogram.jpg'));
                        const histogramCsvFile = processed.find(file => file.name.endsWith('.histogram.csv'));
                        
                        let imageSrc;
                        
                        if (thumbnailFile) {
                            // Use thumbnail if available
                            imageSrc = `${projectUrl}/${thumbnailFile.path}`;
                        } else if (raw.value?.isAdvancedImageFile !== true && processed.length === 0) {
                            const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
                            const isValidImage = validImageExtensions.some(ext => 
                                raw.name.toLowerCase().endsWith(ext)
                            );
                            
                            if (isValidImage) {
                                imageSrc = `${projectUrl}/${raw.path}`;
                            } else {
                                imageSrc = `${BASE_ASSET_URL}/media/default/cover_image/default_logo.png`;
                            }
                        } else {
                            imageSrc = `${BASE_ASSET_URL}/media/default/cover_image/default_logo.png`;
                        }
                        
                        return (
                            <li key={raw.uuid || raw.path} className="c-card--image-top c-card--plain">
                                <img 
                                    className="img-fluid" 
                                    src={imageSrc}
                                    alt={`Preview of ${raw.name}`}
                                />
                                <p>
                                    <strong>{raw.name}</strong>
                                    <br />
                                    {raw.length ? createSizeString(raw.length) : ''}
                                </p>
                                <table className="c-data-list c-data-list--is-vert c-data-list--is-narrow c-data-list--should-truncate-values">
                                    <tbody>
                                        {Object.entries(raw.metadata).map(([key, value]) => {
                                            if (excludedImageMetadataFields.includes(key)) return null;
                                            return (
                                                <tr key={key}>
                                                    <th className="c-data-list__key">{formatLabel(key)}</th>
                                                    <td className="c-data-list__value">{formatLabel(value)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                
                                <p className="dropdown">
                                    <button
                                        className="dropdown-toggle c-button c-button--primary"
                                        data-bs-toggle="dropdown"
                                        type="button"
                                    >
                                        Action
                                    </button>
                                        <menu className="dropdown-menu">
                                           <li>
                                              <a className="dropdown-item" target="_blank" href={`${projectUrl}/${raw.path}`} rel="noreferrer">
                                                  Download File{' '}
                                              </a>
                                           </li>
                                           
                                           {gifFile && (
                                               <li>
                                                   <a className="dropdown-item" target="_blank" href={`${projectUrl}/${gifFile.path}`} rel="noreferrer">
                                                       View GIF
                                                   </a>
                                               </li>
                                           )}
                                           
                                           {histogramFile && (
                                               <li>
                                                   <a className="dropdown-item" target="_blank" href={`${projectUrl}/${histogramFile.path}`} rel="noreferrer">
                                                       Histogram
                                                   </a>
                                               </li>
                                           )}
                                           
                                           {histogramCsvFile && (
                                               <li>
                                                   <a className="dropdown-item" target="_blank" href={`${projectUrl}/${histogramCsvFile.path}`} rel="noreferrer">
                                                       Histogram (CSV)
                                                   </a>
                                               </li>
                                           )}
                                       </menu>
                                 </p>
                            </li>
                        );
                    })}
                </ul>
            </section>
            <div className={styles['pagination-container']}>
                <Paginator
                    pages={paginationData.totalPages}
                    current={currentPage}
                    callback={handlePageChange}
                    spread={5}
                />
            </div>
            </>
            )}
        </>

    )
}

PublishedDatasetEntityDetail.propTypes = {
    params: PropTypes.object.isRequired,
};

export default PublishedDatasetEntityDetail;