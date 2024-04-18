import React from 'react';
import PropTypes from 'prop-types';
import { Section, SectionContent, LoadingSpinner } from '_common';
import styles from './DataFilesProjectFileListingMetadataAddon.module.scss';
import { useFileListing } from 'hooks/datafiles';

const  DataDisplay = ({ data }) => {
  
  // Function to format the dict key from snake_case to Label Case i.e. data_type -> Data Type
  const formatLabel = (key) => 
    key.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  //filter out empty values and unwanted keys
  const processedData = Object.entries(data)
    .filter(([key, value]) => value !== "" && key !== "name" && key !== "description")
    .map(([key, value]) => ({
      label: formatLabel(key),
      value: value,
    }));

    // Divide processed data into chunks for two-column layout display
    const chunkSize = Math.ceil(processedData.length / 2);
    const chunks = [];
    for (let i = 0; i < processedData.length; i += chunkSize) {
      chunks.push(processedData.slice(i, i + chunkSize));
    }
    
    const renderDataEntries = (entries) => (
      entries.map(({ label, value }, index) => (
        <div key={index}>
          <strong>{label}:</strong> {value}
        </div>
      ))
    );

    // Render each data entry within its chunk for two-column layout
    return (
      <Section contentLayoutName="twoColumn">
        {chunks.map((chunk, index) => (
          <SectionContent key={index}>
            {renderDataEntries(chunk)}
          </SectionContent>
        ))}
      </Section>
    );
}

const DataFilesProjectFileListingMetadataAddon = ({ folderMetadata, metadata, path }) => {

  const { loading } = useFileListing('FilesListing');

  return (
    <>
      {!loading && (
        folderMetadata ? (
          <>
            {folderMetadata.description}
            <DataDisplay data={folderMetadata} />
          </>
        ) : (
          metadata.description
        )
      )}
    </>
  );
}

DataFilesProjectFileListingMetadataAddon.propTypes = {
  folderMetadata: PropTypes.object.isRequired,
};

export default DataFilesProjectFileListingMetadataAddon;