import React, { useEffect, useState } from 'react';
import {
  Button,
  ShowMore,
  SectionTableWrapper,
  DescriptionList,
  Expand,
} from '_common';
import styles from './DataFilesProjectPublishWizard.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { formatDate } from 'utils/timeFormat';
import { formatDataKey } from 'utils/dataKeyFormat';

const ProjectDescription = ({ project }) => {
  const dispatch = useDispatch();
  const [data, setData] = useState({});

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
      Abstract: <ShowMore> {project.description} </ShowMore>,
      License: project.license ?? 'None',
    };

    if (project.cover_image) {
      projectData['Cover Image'] = (
        <a href={project.file_url} target='_blank' rel="noreferrer" className='wb-link'>
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

    if (project.related_publications?.length > 0) {
      const relatedPublicationCards = project.related_publications.map(
        (publication) => {
          return (
            <Expand
              className={styles['project-expand-card']}
              detail={publication.publication_title}
              message={
                <DescriptionList
                  data={Object.keys(publication).reduce((acc, key) => {
                    acc[formatDataKey(key)] = publication[key];
                    return acc;
                  }, {})}
                  direction={'vertical'}
                  density={'compact'}
                />
              }
            />
          );
        }
      );

      projectData['Related Publications'] = relatedPublicationCards;
    } else {
      projectData['Related Publications'] = 'None';
    }

    if (project.related_datasets?.length > 0) {
      const relatedDatasetCards = project.related_datasets.map((dataset) => {
        return (
          <Expand
            className={styles['project-expand-card']}
            detail={dataset.dataset_title}
            message={
              <DescriptionList
                data={Object.keys(dataset).reduce((acc, key) => {
                  acc[formatDataKey(key)] = dataset[key];
                  return acc;
                }, {})}
                direction={'vertical'}
                density={'compact'}
              />
            }
          />
        );
      });

      projectData['Related Datasets'] = relatedDatasetCards;
    } else {
      projectData['Related Datasets'] = 'None';
    }

    if (project.related_software?.length > 0) {
      const relatedSoftwareCards = project.related_software.map((software) => {
        return (
          <Expand
            className={styles['project-expand-card']}
            detail={software.software_title}
            message={
              <DescriptionList
                data={Object.keys(software).reduce((acc, key) => {
                  acc[formatDataKey(key)] = software[key];
                  return acc;
                }, {})}
                direction={'vertical'}
                density={'compact'}
              />
            }
          />
        );
      });

      projectData['Related Software'] = relatedSoftwareCards;
    } else {
      projectData['Related Software'] = 'None';
    }

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
      <DescriptionList data={data} direction={'vertical'} />
    </SectionTableWrapper>
  );
};

export const ProjectDescriptionStep = ({ project }) => ({
  id: 'project_description',
  name: 'Project Description',
  render: <ProjectDescription project={project} />,
  initialValues: {},
});
