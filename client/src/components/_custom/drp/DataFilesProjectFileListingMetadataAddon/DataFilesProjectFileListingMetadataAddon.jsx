import React from 'react';
import PropTypes from 'prop-types';
import styles from './DataFilesProjectFileListingMetadataAddon.module.scss';
import { useFileListing } from 'hooks/datafiles';
import DataDisplay from '../utils/DataDisplay/DataDisplay';
import { formatDate } from 'utils/timeFormat';
import { MLACitation } from '../DataFilesProjectPublish/DataFilesProjectPublishWizardSteps/ReviewAuthors';
import { Button } from '_common';
import { useDispatch } from 'react-redux';

const excludeKeys = [
  'name',
  'description',
  'data_type',
  'sample',
  'digital_dataset',
  'file_objs',
];

const DataFilesProjectFileListingMetadataAddon = ({
  folderMetadata,
  metadata,
  path,
  showCitation,
}) => {
  const dispatch = useDispatch();

  const { loading } = useFileListing('FilesListing');

  const getProjectMetadata = ({
    publication_date,
    created,
    license,
    doi,
    keywords,
  }) => {
    const dateOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    const dateLabel = publication_date ? 'Publication Date' : 'Created';

    return {
      [dateLabel]: new Date(
        publication_date || created
      ).toLocaleDateString('en-US', dateOptions),
      license: license ?? 'None',
      ...(doi && { doi }),
      ...(keywords && { keywords }),
    };
  };

  const getProjectModalMetadata = (metadata) => {
    const fields = [
      'related_publications',
      'related_software',
      'related_datasets',
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
              path={path}
              excludeKeys={excludeKeys}
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
              path={path}
              excludeKeys={[]}
              modalData={getProjectModalMetadata(metadata)}
            />
          </>
        ))}
    </>
  );
};

DataFilesProjectFileListingMetadataAddon.propTypes = {
  folderMetadata: PropTypes.shape({}).isRequired,
};

export default DataFilesProjectFileListingMetadataAddon;
