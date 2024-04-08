import React from 'react';
import PropTypes from 'prop-types';
import { Section, SectionContent, } from '_common';
import styles from './DataFilesProjectFileListingMetadataAddon.module.scss';

const  DataDisplay = ({ data }) => {
  const formatLabel = (key) => key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  const processedData = Object.entries(data)
    .filter(([key, value]) => value !== "" && key !== "name" && key !== "description")
    .map(([key, value]) => ({
      label: formatLabel(key),
      value: value,
    }));

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

const DataFilesProjectFileListingMetadataAddon = ({ folderMetadata }) => {
  return (
    <>
      {folderMetadata.description}
      <DataDisplay data={folderMetadata} />
    </>
  );
};

DataFilesProjectFileListingMetadataAddon.propTypes = {
  folderMetadata: PropTypes.object.isRequired,
};

export default DataFilesProjectFileListingMetadataAddon;