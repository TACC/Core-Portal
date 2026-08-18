import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import {
  PublicationWizard,
  PublicationInstructionsStep,
  ProjectDescriptionStep,
  ReviewProjectStructureStep,
  ReviewAuthorsStep,
  SubmitPublicationRequestStep,
} from '_common/ProjectPublication';
import * as ROUTES from '../../../../constants/routes';

// DRP-specific publication copy, curator contact, and validators. The curator
// contact and validators are also used by the DRP review flow.
const DRP_INSTRUCTIONS = (
  <>
    <p>
      You are requesting to publish this project. By publishing your project, it
      will be available to anyone to view and download the project data and
      metadata.
      <b> Please note:</b> Once a project is published, any changes to published
      files/data requires a new version
    </p>
    <p>
      You will begin the process of reviewing your data publication. This
      publication represents your unique research. You are the person that best
      knows your data and how to present it to the public. The system will help
      you through the process. Please complete the form below to begin the
      publication process.
    </p>
    <p>
      Before publication, please corroborate with the main author of the project
      who else should be added as author of this publication and the order in
      which authors should be added.
    </p>
  </>
);

export const DRP_CURATOR_CONTACT = (
  <>
    If you have any doubts about the process please contact the data curator{' '}
    <a href="mailto:maria@tacc.utexas.edu">Maria Esteva</a> before submitting the
    data for publication.
  </>
);

export const drpMetadataValidate = (values) => {
  const errors = {};
  if (!values.title) {
    errors.title = 'Title is required';
  }
  if (!values.description) {
    errors.description = 'Description is required';
  }
  if (!values.cover_image) {
    errors.cover_image = 'Cover image is required';
  }
  return errors;
};

const validateFolder = (node) => {
  const errors = [];

  const hasFileObjs = (n) => {
    if (n.fileObjs && n.fileObjs.length > 0) {
      return true;
    }
    if (n.children && n.children.length > 0) {
      return n.children.some((child) => hasFileObjs(child));
    }
    return false;
  };

  if (!hasFileObjs(node)) {
    errors.push(
      `Entity "${node.label}" (path: /${node.path}) has no files in itself or any of its child entities.`
    );
  }

  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      errors.push(...validateFolder(child));
    });
  }

  return errors;
};

export const drpStructureValidate = (tree) => {
  const validationErrors = [];

  (tree || []).forEach((node) => {
    const nodeErrors = validateFolder(node);
    if (nodeErrors.length > 0) {
      validationErrors.push(...nodeErrors);
    }
  });

  const errors = {};
  validationErrors.forEach((error, index) => {
    errors[`folder_${index}`] = error;
  });

  return errors;
};

// DRP publish flow = the generic publication wizard with DRP copy, curator
// contact, and entity validation.
const DataFilesProjectPublish = ({ rootSystem, system }) => {
  const dispatch = useDispatch();
  const callbackUrl = `${ROUTES.WORKBENCH}${ROUTES.DATA}/tapis/projects/${rootSystem}/${system}`;

  return (
    <PublicationWizard
      system={system}
      rootSystem={rootSystem}
      title="Request Dataset Publication"
      redirectOnPending
      renderSteps={({ metadata, tree, onAuthorsUpdate }) => [
        PublicationInstructionsStep({ instructions: DRP_INSTRUCTIONS }),
        ProjectDescriptionStep({ project: metadata, validate: drpMetadataValidate }),
        ReviewProjectStructureStep({
          projectId: metadata.projectId,
          projectTree: tree,
          validate: drpStructureValidate,
        }),
        ReviewAuthorsStep({ project: metadata, onAuthorsUpdate }),
        SubmitPublicationRequestStep({ callbackUrl, contact: DRP_CURATOR_CONTACT }),
      ]}
      onSubmit={(values, { metadata, authors }) => {
        if (values.formSubmitted) {
          dispatch({
            type: 'PROJECTS_CREATE_PUBLICATION_REQUEST',
            payload: { ...metadata, authors },
          });
        }
      }}
    />
  );
};

DataFilesProjectPublish.propTypes = {
  rootSystem: PropTypes.string,
  system: PropTypes.string,
};

export default DataFilesProjectPublish;
