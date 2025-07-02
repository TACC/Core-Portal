import React from 'react';
import { SectionTableWrapper, Section } from '_common';
import styles from './DataFilesProjectPublishWizard.module.scss';

const PublicationInstructions = () => {
  return (
    <SectionTableWrapper
      header={<div className={styles.title}>Publication Instructions</div>}
    >
      <Section contentLayoutName={'oneColumn'}>
        <p>
          You are requesting to publish this project. By publishing your
          project, it will be available to anyone to view and download the
          project data and metadata.
          <b> Please note:</b> once a project is published it is no longer
          editable!
        </p>
        <p>
          You will begin the process of reviewing your data publication. This
          publication represents your unique research. You are the person that
          best knows your data and how to present it to the public. The system
          will help you through the process. Please complete the form below to
          begin the publication process.
        </p>
        <p>
          Before publication, please corroborate with the main author of the
          project who else should be added as author of this publication and the
          order in which authors should be added.
        </p>
      </Section>
    </SectionTableWrapper>
  );
};

export const PublicationInstructionsStep = () => ({
  id: 'publication_instructions',
  name: 'Publication Instructions',
  render: <PublicationInstructions />,
  initialValues: {},
});
