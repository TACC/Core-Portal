import React from 'react';
import PropTypes from 'prop-types';
import { SectionTableWrapper, Section } from '_common';
import styles from '../PublicationWizard.module.scss';

const DEFAULT_INSTRUCTIONS = (
  <p>
    You are requesting to publish this project. Once published, the project data
    and metadata will be publicly viewable and downloadable.
  </p>
);

// Intro step for the publish flow. A portal can pass its own `instructions`.
const PublicationInstructions = ({ instructions }) => (
  <SectionTableWrapper
    header={<div className={styles.title}>Publication Instructions</div>}
  >
    <Section contentLayoutName={'oneColumn'}>{instructions}</Section>
  </SectionTableWrapper>
);

PublicationInstructions.propTypes = {
  instructions: PropTypes.node,
};

export const PublicationInstructionsStep = ({
  instructions = DEFAULT_INSTRUCTIONS,
} = {}) => ({
  id: 'publication_instructions',
  name: 'Publication Instructions',
  render: <PublicationInstructions instructions={instructions} />,
  initialValues: {},
});

export default PublicationInstructions;
