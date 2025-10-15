import React from 'react';
import PropTypes from 'prop-types';
import { Section, SectionContent, LoadingSpinner, Button } from '_common';
import { useLocation, Link } from 'react-router-dom';
import styles from './DataDisplay.module.scss';
import { useDispatch } from 'react-redux';
import { formatLabel } from '../utils';
import { findNodeInTree } from '../utils';

// const processSampleAndOriginData = (data, path) => {
//   // use the path to get sample and origin data names
//   const sample = data.sample ? path.split('/')[0] : null;
//   // const origin_data = data.digital_dataset ? path.split('/')[1] : null;

//   // remove trailing / from pathname
//   const locationPathname = location.pathname.endsWith('/')
//     ? location.pathname.slice(0, -1)
//     : location.pathname;

//   const locationPathnameParts = locationPathname.split('/');

//   const sampleAndOriginMetadata = [];

//   // construct urls for sample and origin data and add to processed data
//   if (sample) {
//     const sampleUrl = locationPathnameParts
//       .slice(0, data.digital_dataset ? -2 : -1)
//       .join('/');
//     sampleAndOriginMetadata.push({
//       label: 'Sample',
//       value: (
//         <Link className={`${styles['dataset-link']}`} to={sampleUrl}>
//           {sample}
//         </Link>
//       ),
//     });
//   }

//   // if (origin_data) {
//   //   const originDataUrl = locationPathnameParts.slice(0, -1).join('/');
//   //   sampleAndOriginMetadata.push({
//   //     label: 'Origin Data',
//   //     value: (
//   //       <Link className={`${styles['dataset-link']}`} to={originDataUrl}>
//   //         {origin_data}
//   //       </Link>
//   //     ),
//   //   });
//   // }

//   return sampleAndOriginMetadata;
// };


const processModalViewableData = (data) => {
  const createViewDataModal = (key, value) => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'viewData',
        props: { key, value },
      },
    });
  };

  const dispatch = useDispatch();

  return Object.entries(data).map(([key, value]) => ({
    label: formatLabel(key),
    value: (
      <Button type="link" onClick={() => createViewDataModal(key, value)}>
        View
      </Button>
    ),
  }));
};

const processCoverImage = (data) => {
  return [{
    label: 'Cover Image',
    value: 
      <a href={data.file_url} target='_blank' rel="noreferrer" className='wb-link'>
        {data.cover_image.split('/').pop()}
      </a>
  }]
}

const DataDisplay = ({ data, tree, system, path, excludeKeys, modalData, coverImage }) => {
  //filter out empty values and unwanted keys
  let processedData = Object.entries(data)
    .filter(([key, value]) => value !== '' && !excludeKeys.includes(key))
    .map(([key, value]) => ({
      label: formatLabel(key),
      value: typeof value === 'string' ? formatLabel(value) : value,
    }));

  if (coverImage) {
    processedData.unshift(...processCoverImage(data));
  }

  // if (path) {
  //   processedData.unshift(...processSampleAndOriginData(data, path));
  // }

  if (modalData) {
    processedData.push(...processModalViewableData(modalData));
  }

  const addEntityLink = (key, label) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (data[key] && uuidRegex.test(data[key])) {
      const entity = findNodeInTree(tree, data[key]);
      const index = location.pathname.indexOf(system) + system.length;
      const url = `${location.pathname.slice(0, index)}/${entity.path}`;

      processedData = processedData.filter(entry => entry.label !== label);

      processedData.unshift({
        label,
        value: <Link className={`${styles['dataset-link']}`} to={url}>{entity.label}</Link>
      });
    }
  };

  // Apply to digital_dataset and sample. If path is provided, we can add the links.
  if (path) {
    addEntityLink('digital_dataset', 'Digital Dataset');
    addEntityLink('sample', 'Sample');
  }
  // Divide processed data into chunks for two-column layout display
  const chunkSize = Math.ceil(processedData.length / 2);
  const chunks = [];
  for (let i = 0; i < processedData.length; i += chunkSize) {
    chunks.push(processedData.slice(i, i + chunkSize));
  }

  const renderDataEntries = (entries) =>
    entries.map(({ label, value }, index) => (
      <div key={index}>
        <strong>{label}:</strong> {value}
      </div>
    ));

  // Render each data entry within its chunk for two-column layout
  return (
    <Section
      contentLayoutName="twoColumn"
      className={`${styles['metadata-section']}`}
    >
      {chunks.map((chunk, index) => (
        <SectionContent layoutName="oneColumn" key={index}>
          {renderDataEntries(chunk)}
        </SectionContent>
      ))}
    </Section>
  );
};

DataDisplay.propTypes = {
  data: PropTypes.object.isRequired,
  path: PropTypes.string,
  excludeKeys: PropTypes.array,
};

export default DataDisplay;
