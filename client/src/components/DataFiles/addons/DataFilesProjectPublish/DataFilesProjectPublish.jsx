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

// Default publish flow: the generic publication wizard with baseline steps.
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
        PublicationInstructionsStep(),
        ProjectDescriptionStep({ project: metadata }),
        ReviewProjectStructureStep({
          projectId: metadata.projectId,
          projectTree: tree,
        }),
        ReviewAuthorsStep({ project: metadata, onAuthorsUpdate }),
        SubmitPublicationRequestStep({ callbackUrl }),
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
