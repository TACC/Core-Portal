import React, { useEffect, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Button,
  ShowMore,
  LoadingSpinner,
  SectionMessage,
  SectionTableWrapper,
} from '_common';
import {
  useAddonComponents,
  useFileListing,
  useSystems,
} from 'hooks/datafiles';
import DataFilesListing from '../DataFilesListing/DataFilesListing';
import styles from './DataFilesProjectFileListing.module.scss';

const DataFilesProjectFileListing = ({
  rootSystem,
  system,
  path,
  basePath,
}) => {
  const dispatch = useDispatch();
  const { fetchListing } = useFileListing('FilesListing');
  const { isPublicationSystem, isReviewSystem } = useSystems();
  if (!basePath) basePath = '/workbench/data';

  // logic to render addonComponents for DRP
  const portalName = useSelector((state) => state.workbench.portalName);
  const {
    DataFilesProjectFileListingAddon,
    DataFilesProjectFileListingMetadataAddon,
    DataFilesProjectFileListingMetadataTitleAddon,
  } = useAddonComponents({ portalName });
  useEffect(() => {
    dispatch({
      type: 'PROJECTS_GET_METADATA',
      payload: system,
    });

    dispatch({
      type: 'PROJECTS_GET_PUBLICATION_REQUESTS',
      payload: system,
    });
  }, [system]);

  useEffect(() => {
    fetchListing({ api: 'tapis', scheme: 'projects', system, path });
  }, [system, path, fetchListing]);

  const metadata = useSelector((state) => state.projects.metadata);
  const folderMetadata = useSelector(
    (state) => state.files.folderMetadata?.FilesListing
  );

  const canEditSystem = useSelector(
    (state) =>
      metadata.members
        .filter((member) =>
          member.user
            ? member.user.username === state.authenticatedUser?.user?.username
            : { access: null }
        )
        .map((currentUser) => currentUser.access === 'owner')[0]
  );

  const readOnlyTeam = useSelector((state) => {
    const projectSystem = state.systems.storage.configuration.find(
      (s) => s.scheme === 'projects'
    );

    return projectSystem?.readOnly || !canEditSystem;
  });

  const onEdit = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'editproject', props: {} },
    });
  };

  const onManage = () => {
    dispatch({
      type: 'USERS_CLEAR_SEARCH',
    });
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'manageproject', props: {} },
    });
  };

  if (metadata.loading) {
    return (
      <div className={styles['root-placeholder']}>
        <LoadingSpinner />
      </div>
    );
  }

  if (metadata.error) {
    return (
      <div className={styles['root-placeholder']}>
        <SectionMessage type="warning">
          We were unable to retrieve this shared workspace.
        </SectionMessage>
      </div>
    );
  }

  return (
    <SectionTableWrapper
      className={styles.root}
      header={
        <div className={styles.title}>
          {DataFilesProjectFileListingMetadataTitleAddon ? (
            <DataFilesProjectFileListingMetadataTitleAddon
              folderMetadata={folderMetadata}
              metadata={metadata}
              system={system}
              path={path}
            />
          ) : (
            metadata.title
          )}
        </div>
      }
      headerActions={
        <div className={styles.controls}>
          {canEditSystem ? (
            <>
              <Button type="link" onClick={onEdit}>
                Edit Dataset
              </Button>
              <span className={styles.separator}>|</span>
            </>
          ) : null}
          {!isPublicationSystem(rootSystem) && !isReviewSystem(rootSystem) && (
            <Button type="link" onClick={onManage}>
              {readOnlyTeam ? 'View' : 'Manage'} Team
            </Button>
          )}
          {DataFilesProjectFileListingAddon && (
            <DataFilesProjectFileListingAddon
              rootSystem={rootSystem}
              system={system}
            />
          )}
        </div>
      }
      manualContent
    >
      {/* RFE: If this description element is re-used, then it should become:
               - (A) part of <SectionTableWrapper>
               - (B) part of <SectionHeader>
               - (C) an independent component <SectionDescription>
               - (D) __both__ (A) or (B) __and__ (C)
      */}
      <div className={styles.description}>
        <>
          {DataFilesProjectFileListingMetadataAddon ? (
            <ShowMore key={`${system}-${path}`}>
              <DataFilesProjectFileListingMetadataAddon
                folderMetadata={folderMetadata}
                metadata={metadata}
                path={path}
                showCitation={isPublicationSystem(rootSystem)}
              />
            </ShowMore>
          ) : (
            <ShowMore>{metadata.description}</ShowMore>
          )}
        </>
      </div>
      <DataFilesListing
        api="tapis"
        scheme="projects"
        system={system}
        path={path || '/'}
        basePath={basePath}
        rootSystem={rootSystem}
      />
    </SectionTableWrapper>
  );
};

DataFilesProjectFileListing.propTypes = {
  system: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
};

export default DataFilesProjectFileListing;
