import React from 'react';
import PropTypes from 'prop-types';
import { Section, SectionContent, LoadingSpinner } from '_common';
import { useLocation, Link } from 'react-router-dom';
import styles from './DataDisplay.module.scss';
import { useFileListing } from 'hooks/datafiles';

const processSampleAndOriginData = (data, path) => {
  // use the path to get sample and origin data names
  const sample = data.sample ? path.split('/')[0] : null;
  const origin_data = data.base_origin_data ? path.split('/')[1] : null;

  // remove trailing / from pathname
  const locationPathname = location.pathname.endsWith('/') ? location.pathname.slice(0, -1) : location.pathname;
  
  const locationPathnameParts = locationPathname.split('/');

  const sampleAndOriginMetadata = []

  // construct urls for sample and origin data and add to processed data
  if (sample) {
    const sampleUrl = locationPathnameParts.slice(0, data.base_origin_data ? -2 : -1).join('/')
    sampleAndOriginMetadata.push({ label: 'Sample', value: <Link className={`${styles['dataset-link']}`} to={sampleUrl}>{sample}</Link> });   
  }

  if (origin_data) {
    const originDataUrl = locationPathnameParts.slice(0, -1).join('/');
    sampleAndOriginMetadata.push({ label: 'Origin Data', value: <Link className={`${styles['dataset-link']}`} to={originDataUrl}>{origin_data}</Link> });  

  }

  return sampleAndOriginMetadata;
}

const DataDisplay = ({ data, path, excludeKeys }) => {

    const location = useLocation();
    
    // Function to format the dict key from snake_case to Label Case i.e. data_type -> Data Type
    const formatLabel = (key) => 
      key.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
  
    //filter out empty values and unwanted keys
    const processedData = Object.entries(data)
      .filter(([key, value]) => value !== "" && !excludeKeys.includes(key))
      .map(([key, value]) => ({
        label: formatLabel(key),
        value: typeof(value) === 'string' ? formatLabel(value) : value
      }));

    if (path) {
      processedData.unshift(...processSampleAndOriginData(data, path));
    }
  
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
      <Section contentLayoutName="twoColumn" className={`${styles['metadata-section']}`}>
        {chunks.map((chunk, index) => (
          <SectionContent layoutName='oneColumn' key={index}>
            {renderDataEntries(chunk)}
          </SectionContent>
        ))}
      </Section>
    );
  }

DataDisplay.propTypes = {
  data: PropTypes.object.isRequired,
  path: PropTypes.string.isRequired,
  excludeKeys: PropTypes.array
};

export default DataDisplay;