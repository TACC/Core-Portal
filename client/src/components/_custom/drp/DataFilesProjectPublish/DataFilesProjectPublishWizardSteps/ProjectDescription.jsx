import React, { useEffect, useState } from 'react';
import {
  Button,
  ShowMore,
  SectionTableWrapper,
  DescriptionList,
  Expand,
} from '_common';
import styles from './DataFilesProjectPublishWizard.module.scss';
import { useDispatch } from 'react-redux';
import { formatDate } from 'utils/timeFormat';
import { formatDataKey } from 'utils/dataKeyFormat';

const ProjectDescription = ({ project }) => {
  const dispatch = useDispatch();
  const [data, setData] = useState({});

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
    }

    if (project.keywords) {
      projectData['Keywords'] = project.keywords
    }

    if (project.related_publications?.length > 0) {
      const relatedPublicationCards = project.related_publications.map((publication) => {
        return (
          <Expand
            className={styles['project-expand-card']}
            detail={publication.publication_title}
            message={
              <DescriptionList
                data={Object.keys(publication).reduce((acc, key) => {
                  acc[formatDataKey(key)] = publication[key];
                  return acc;
                }, {})
                }
                direction={'vertical'}
                density={'compact'}
              />
            }
          />
        )
      })

      projectData['Related Publications'] = relatedPublicationCards
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
                }, {})
                }
                direction={'vertical'}
                density={'compact'}
              />
            }
          />
        )
      })

      projectData['Related Datasets'] = relatedDatasetCards
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
                }, {})
                }
                direction={'vertical'}
                density={'compact'}
              />
            }
          />
        )
      })

      projectData['Related Software'] = relatedSoftwareCards
    }

    setData(projectData)

  }, [project])

  return (
    <SectionTableWrapper
      header={<div className={styles.title}>Proofread Project</div>}
      headerActions={
        <div className={styles.controls}>
          <>
            <Button type="link" onClick={onEdit}>
              Edit Project
            </Button>
          </>
        </div>
      }
    >
      <DescriptionList
        data={data}
        direction={'vertical'}
      />
    </SectionTableWrapper>
  );
};

export const ProjectDescriptionStep = ({ project }) => ({
  id: 'project_description',
  name: 'Project Description',
  render: <ProjectDescription project={project} />,
  initialValues: {},
});
