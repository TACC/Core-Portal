import React from 'react';
import PropTypes from 'prop-types';
import { Button, SectionTableWrapper, Section } from '_common';
import styles from '../PublicationWizard.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { useAddonComponents } from 'hooks/datafiles';
import { useFormikContext } from 'formik';

// Review the project's data tree before publication.
const ReviewProjectStructure = ({ projectId }) => {
  const dispatch = useDispatch();
  const portalName = useSelector((state) => state.workbench.portalName);
  const { DataFilesProjectTree } = useAddonComponents({ portalName });

  const { errors } = useFormikContext();

  const canEdit = useSelector((state) => {
    const { members } = state.projects.metadata;
    const { username } = state.authenticatedUser.user;
    const currentUser = members.find(
      (member) => member.user?.username === username
    );

    if (!currentUser) {
      return false;
    }

    return currentUser.access === 'owner' || currentUser.access === 'edit';
  });

  const onEdit = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'editproject', props: {} },
    });
  };

  return (
    <SectionTableWrapper
      header={
        <div className={styles.title}>Review Data Structure and Description</div>
      }
      headerActions={
        <>
          {canEdit && (
            <div className={styles.controls}>
              <>
                <Button type="link" onClick={onEdit}>
                  Edit Dataset
                </Button>
              </>
            </div>
          )}
        </>
      }
    >
      <Section
        contentLayoutName={'oneColumn'}
        className={styles['description-section']}
      >
        {Object.keys(errors).length > 0 && (
          <div className={styles['errors-div']}>
            <p>Dataset structure has the following errors:</p>
            <ul>
              {Object.keys(errors).map((key) => (
                <li key={key}>
                  <b>{errors[key]}</b>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className={styles['description']}>
          <p>
            Review the data tree structure to make sure that the relationships
            between the data components are correct.
          </p>
        </div>
        {DataFilesProjectTree && (
          <DataFilesProjectTree projectId={projectId} readOnly={!canEdit} />
        )}
      </Section>
    </SectionTableWrapper>
  );
};

ReviewProjectStructure.propTypes = {
  projectId: PropTypes.string,
};

const noValidation = () => ({});

export const ReviewProjectStructureStep = ({
  projectId,
  projectTree,
  validate = noValidation,
}) => ({
  id: 'project_structure',
  name: 'Review Project Structure',
  render: <ReviewProjectStructure projectId={projectId} />,
  initialValues: projectTree,
  validate,
});

export default ReviewProjectStructure;
