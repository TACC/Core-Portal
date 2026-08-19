import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import {
  PublicationWizard,
  ProjectDescriptionStep,
  ReviewProjectStructureStep,
  ReviewAuthorsStep,
  SubmitPublicationReviewStep,
} from '_common/ProjectPublication';
import * as ROUTES from '../../../../constants/routes';
import {
  DRP_CURATOR_CONTACT,
  drpMetadataValidate,
  drpStructureValidate,
} from '../DataFilesProjectPublish/DataFilesProjectPublish';

// DRP review flow = the generic publication wizard with DRP validation and
// curator contact.
const DataFilesProjectReview = ({ rootSystem, system }) => {
  const dispatch = useDispatch();
  const callbackUrl = `${ROUTES.WORKBENCH}${ROUTES.DATA}/tapis/projects/${rootSystem}`;

  return (
    <PublicationWizard
      system={system}
      rootSystem={rootSystem}
      title="Review Publication Request"
      renderSteps={({ metadata, tree, onAuthorsUpdate }) => [
        ProjectDescriptionStep({
          project: metadata,
          validate: drpMetadataValidate,
        }),
        ReviewProjectStructureStep({
          projectId: metadata.projectId,
          projectTree: tree,
          validate: drpStructureValidate,
        }),
        ReviewAuthorsStep({
          project: metadata,
          onAuthorsUpdate,
          isReviewProject: true,
        }),
        SubmitPublicationReviewStep({
          callbackUrl,
          contact: DRP_CURATOR_CONTACT,
        }),
      ]}
      onSubmit={(values, { metadata }) => {
        if (values?.publicationApproved) {
          dispatch({
            type: 'PUBLICATIONS_APPROVE_PUBLICATION',
            payload: { ...metadata },
          });
        } else if (values?.publicationRejected) {
          dispatch({
            type: 'PUBLICATIONS_REJECT_PUBLICATION',
            payload: { ...metadata },
          });
        } else if (values?.versionApproved) {
          dispatch({
            type: 'PUBLICATIONS_APPROVE_VERSION',
            payload: { ...metadata },
          });
        }
      }}
    />
  );
};

DataFilesProjectReview.propTypes = {
  rootSystem: PropTypes.string,
  system: PropTypes.string,
};

export default DataFilesProjectReview;
