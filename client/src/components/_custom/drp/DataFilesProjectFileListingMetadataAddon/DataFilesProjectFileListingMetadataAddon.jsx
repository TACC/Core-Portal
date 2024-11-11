import React from 'react';
import PropTypes from 'prop-types';
import styles from './DataFilesProjectFileListingMetadataAddon.module.scss';
import { useFileListing } from 'hooks/datafiles';
import DataDisplay from '../utils/DataDisplay/DataDisplay';
import { formatDate } from 'utils/timeFormat';

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
}) => {
  const { loading } = useFileListing('FilesListing');

  const getProjectMetadata = (metadata) => {
    const dateOptions = { month: 'long', day: 'numeric', year: 'numeric' };

    const formattedMetadata = {
      created: new Date(metadata.created).toLocaleDateString(
        'en-US',
        dateOptions
      ),
      license: metadata.license ?? 'None',
    };

    if (metadata.doi) {
      formattedMetadata.doi = metadata.doi;
    }

    if (metadata.keywords) {
      formattedMetadata.keywords = metadata.keywords;
    }

    return formattedMetadata;
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
            {metadata.description}
            <DataDisplay
              data={getProjectMetadata(metadata)}
              path={path}
              excludeKeys={[]}
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
