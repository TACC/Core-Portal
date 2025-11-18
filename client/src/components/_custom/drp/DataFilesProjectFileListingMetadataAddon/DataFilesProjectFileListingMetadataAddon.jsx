import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './DataFilesProjectFileListingMetadataAddon.module.scss';
import { useFileListing } from 'hooks/datafiles';
import DataDisplay from '../utils/DataDisplay/DataDisplay';
import { formatDate } from 'utils/timeFormat';
import { MLACitation } from '../DataFilesProjectPublish/DataFilesProjectPublishWizardSteps/ReviewAuthors';
import { Button } from '_common';
import { useDispatch, useSelector } from 'react-redux';
import { EXCLUDED_METADATA_FIELDS } from '../constants/metadataFields';

const DataFilesProjectFileListingMetadataAddon = ({
  folderMetadata,
  metadata,
  path,
  showCitation,
}) => {
  const dispatch = useDispatch();

  const { portalName } = useSelector((state) => state.workbench);
  const { project_id: system } = useSelector((state) => state.projects.metadata);
  const { value: tree, error } = useSelector((state) => state.publications.tree);
  const { loading } = useFileListing('FilesListing');

  useEffect(() => {
    if (system && portalName && !error) {
      dispatch({
          type: 'PUBLICATIONS_GET_TREE',
          payload: { portalName, system },
      });
    }
  }, [system, portalName]);

  const getProjectMetadata = ({
    publication_date,
    created,
    license,
    doi,
    keywords,
    cover_image,
    file_url,
  }) => {
    const dateOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    const dateLabel = publication_date ? 'Publication Date' : 'Created';

    return {
      [dateLabel]: new Date(publication_date || created).toLocaleDateString(
        'en-US',
        dateOptions
      ),
      license: license ?? 'None',
      ...(doi && { doi }),
      ...(keywords && { keywords }),
      ...(cover_image && { cover_image }),
      ...(file_url && { file_url }),
    };
  };

  const getProjectModalMetadata = (metadata) => {
    const fields = [
      'related_publications',
      'related_datasets',
      'related_software',
    ];
    return fields.reduce((formattedMetadata, field) => {
      if (metadata[field] && metadata[field].length > 0) {
        formattedMetadata[field] = metadata[field];
      }
      return formattedMetadata;
    }, {});
  };

  const createProjectCitationModal = (project) => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'projectCitation',
        props: { project },
      },
    });
  };

  return (
    <>
      {!loading &&
        (folderMetadata ? (
          <>
            {folderMetadata.description}
            <DataDisplay
              data={folderMetadata}
              tree={tree}
              system={system}
              path={path}
              excludeKeys={EXCLUDED_METADATA_FIELDS}
            />
          </>
        ) : (
          <>
            {showCitation && (
              <div className={styles['citation-box']}>
                <h3>Cite This Data:</h3>
                <MLACitation project={metadata} authors={metadata.authors} />
                <div>
                  <Button
                    type="link"
                    className={styles['citation-button']}
                    onClick={() => createProjectCitationModal(metadata)}
                  >
                    View Additional Citations
                  </Button>
                </div>
              </div>
            )}
            {metadata.description}
            <DataDisplay
              data={getProjectMetadata(metadata)}
              tree={tree}
              system={system}
              path={path}
              excludeKeys={EXCLUDED_METADATA_FIELDS}
              modalData={getProjectModalMetadata(metadata)}
              coverImage={metadata.cover_image}
            />
          </>
        ))}
    </>
  );
};

DataFilesProjectFileListingMetadataAddon.propTypes = {
  folderMetadata: PropTypes.shape({}),
};

export default DataFilesProjectFileListingMetadataAddon;
