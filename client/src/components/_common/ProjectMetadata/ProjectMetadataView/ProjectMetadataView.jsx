import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { MLACitation } from '_common/Citations/Citations';
import { Button, ShowMore } from '_common';
import MetadataDisplay from '../MetadataDisplay/MetadataDisplay';
import styles from './ProjectMetadataView.module.scss';

// Generic project/folder metadata view: description, citation, and the
// key/value MetadataDisplay.
const ProjectMetadataView = ({
  folderMetadata,
  metadata,
  system,
  path,
  showCitation,
  tree,
  entityLinks = [],
  excludeKeys = [],
}) => {
  const dispatch = useDispatch();

  const getProjectMetadata = ({
    publication_date,
    created,
    license,
    doi,
    keywords,
    cover_image,
    file_url,
  }) => {
    const dateOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    const dateLabel = publication_date ? 'Publication Date' : 'Created';

    return {
      [dateLabel]: new Date(publication_date || created).toLocaleDateString(
        'en-US',
        dateOptions
      ),
      license: license ?? 'None',
      ...(doi && { doi }),
      ...(keywords && {
        keywords: Array.isArray(keywords) ? keywords.join(', ') : keywords,
      }),
      ...(cover_image && { cover_image }),
      ...(file_url && { file_url }),
    };
  };

  const getProjectModalMetadata = (projectMetadata) => {
    const fields = [
      'related_publications',
      'related_datasets',
      'related_software',
    ];
    return fields.reduce((formattedMetadata, field) => {
      if (projectMetadata[field] && projectMetadata[field].length > 0) {
        formattedMetadata[field] = projectMetadata[field];
      }
      return formattedMetadata;
    }, {});
  };

  const createProjectCitationModal = (project) => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'projectCitation',
        props: { project },
      },
    });
  };

  return folderMetadata ? (
    <>
      {!!folderMetadata.description && (
        <ShowMore className={styles['addon-description']}>
          {folderMetadata.description}
        </ShowMore>
      )}
      <MetadataDisplay
        data={folderMetadata}
        tree={tree}
        system={system}
        path={path}
        excludeKeys={excludeKeys}
        entityLinks={entityLinks}
      />
    </>
  ) : (
    <>
      {showCitation && (
        <div className={styles['citation-box']}>
          <h3>Cite This Data:</h3>
          <MLACitation project={metadata} authors={metadata.authors} />
          <div>
            <Button
              type="link"
              className={styles['citation-button']}
              onClick={() => createProjectCitationModal(metadata)}
            >
              View Additional Citations
            </Button>
          </div>
        </div>
      )}
      {!!metadata.description && (
        <ShowMore className={styles['addon-description']}>
          {metadata.description}
        </ShowMore>
      )}
      <MetadataDisplay
        data={getProjectMetadata(metadata)}
        tree={tree}
        system={system}
        path={path}
        excludeKeys={excludeKeys}
        modalData={getProjectModalMetadata(metadata)}
        coverImage={metadata.cover_image}
        entityLinks={entityLinks}
      />
    </>
  );
};

ProjectMetadataView.propTypes = {
  folderMetadata: PropTypes.shape({}),
  metadata: PropTypes.object,
  excludeKeys: PropTypes.array,
};

export default ProjectMetadataView;
