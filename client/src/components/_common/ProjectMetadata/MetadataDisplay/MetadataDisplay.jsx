import React from 'react';
import PropTypes from 'prop-types';
import { Section, SectionContent, LoadingSpinner, Button } from '_common';
import { Link, useLocation } from 'react-router-dom';
import styles from './MetadataDisplay.module.scss';
import { useDispatch } from 'react-redux';
import { formatLabel } from 'utils/formatLabel';
import { findNodeInTree } from 'utils/tree';

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
  return [
    {
      label: 'Cover Image',
      value: (
        <a
          href={data.file_url}
          target="_blank"
          rel="noreferrer"
          className="wb-link"
        >
          {data.cover_image.split('/').pop()}
        </a>
      ),
    },
  ];
};

// Generic key/value metadata display.
const MetadataDisplay = ({
  data,
  tree,
  system,
  path,
  excludeKeys = [],
  modalData,
  coverImage,
  entityLinks = [],
}) => {
  const location = useLocation();

  // Only show fields that have a value set: skip empty/unset values, excluded
  // keys, and non-primitive values (objects/arrays can't be shown as a value).
  let processedData = Object.entries(data)
    .filter(
      ([key, value]) =>
        value !== '' &&
        value !== null &&
        value !== undefined &&
        typeof value !== 'object' &&
        !excludeKeys.includes(key)
    )
    .map(([key, value]) => ({
      label: formatLabel(key),
      value: typeof value === 'string' ? formatLabel(value) : String(value),
    }));

  if (coverImage) {
    processedData.unshift(...processCoverImage(data));
  }

  if (modalData) {
    processedData.push(...processModalViewableData(modalData));
  }

  const addEntityLink = (key, label) => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (data[key] && uuidRegex.test(data[key])) {
      const entity = findNodeInTree(tree, data[key]);

      if (entity) {
        const index = location.pathname.indexOf(system) + system.length;
        const url = `${location.pathname.slice(0, index)}/${entity.path}`;

        processedData = processedData.filter((entry) => entry.label !== label);

        processedData.unshift({
          label,
          value: (
            <Link className={`${styles['dataset-link']}`} to={url}>
              {entity.label}
            </Link>
          ),
        });
      }
    }
  };

  // Turn configured UUID-valued fields into links to their tree entities.
  if (path) {
    entityLinks.forEach(({ key, label }) => addEntityLink(key, label));
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

MetadataDisplay.propTypes = {
  data: PropTypes.object.isRequired,
  path: PropTypes.string,
  excludeKeys: PropTypes.array,
  entityLinks: PropTypes.array,
};

export default MetadataDisplay;
