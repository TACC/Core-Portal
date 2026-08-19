import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  ShowMore,
  SectionTableWrapper,
  DescriptionList,
  Expand,
} from '_common';
import styles from '../PublicationWizard.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { formatDate } from 'utils/timeFormat';
import { formatDataKey } from 'utils/dataKeyFormat';
import { useFormikContext } from 'formik';

// Proofread view of the project's metadata before publication.
const ProjectDescription = ({ project }) => {
  const dispatch = useDispatch();
  const [data, setData] = useState({});
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

  useEffect(() => {
    let projectData = {
      Title: project.title,
      Created: formatDate(new Date(project.created)),
      Description: (
        <ShowMore className={styles['description-show-more']}>
          {project.description}
        </ShowMore>
      ),
      License: project.license ?? 'None',
    };

    if (project.cover_image) {
      projectData['Cover Image'] = (
        <a
          href={project.file_url}
          target="_blank"
          rel="noreferrer"
          className="wb-link"
        >
          {project.cover_image.split('/').pop()}
        </a>
      );
    }

    if (project.keywords) {
      projectData['Keywords'] = project.keywords;
    }

    if (project.doi) {
      projectData['DOI'] = project.doi;
    }

    const relatedFields = [
      {
        key: 'related_publications',
        label: 'Related Publications',
        title: 'publication_title',
      },
      {
        key: 'related_datasets',
        label: 'Related Datasets',
        title: 'dataset_title',
      },
      {
        key: 'related_software',
        label: 'Related Software',
        title: 'software_title',
      },
    ];

    relatedFields.forEach(({ key, label, title }) => {
      if (project[key]?.length > 0) {
        projectData[label] = project[key].map((item) => (
          <Expand
            className={styles['project-expand-card']}
            detail={item[title]}
            message={
              <DescriptionList
                data={Object.keys(item).reduce((acc, k) => {
                  acc[formatDataKey(k)] = item[k];
                  return acc;
                }, {})}
                direction={'vertical'}
                density={'compact'}
              />
            }
          />
        ));
      } else {
        projectData[label] = 'None';
      }
    });

    setData(projectData);
  }, [project]);

  return (
    <SectionTableWrapper
      header={<div className={styles.title}>Proofread Dataset</div>}
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
      {Object.keys(errors).length > 0 && (
        <div className={styles['errors-div']}>
          <p>Dataset metadata has the following errors:</p>
          <ul>
            {Object.keys(errors).map((key) => (
              <li key={key}>
                <b>{errors[key]}</b>
              </li>
            ))}
          </ul>
        </div>
      )}
      <DescriptionList data={data} direction={'vertical'} />
    </SectionTableWrapper>
  );
};

ProjectDescription.propTypes = {
  project: PropTypes.object,
};

const defaultValidate = (values) => {
  const errors = {};
  if (!values.title) {
    errors.title = 'Title is required';
  }
  if (!values.description) {
    errors.description = 'Description is required';
  }
  return errors;
};

export const ProjectDescriptionStep = ({
  project,
  validate = defaultValidate,
}) => ({
  id: 'project_description',
  name: 'Project Description',
  render: <ProjectDescription project={project} />,
  validate,
  initialValues: project,
});

export default ProjectDescription;
