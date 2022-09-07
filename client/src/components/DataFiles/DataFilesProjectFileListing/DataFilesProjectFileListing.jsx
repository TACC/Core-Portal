import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Button,
  ShowMore,
  LoadingSpinner,
  SectionMessage,
  SectionTableWrapper,
} from '_common';
import { useFileListing } from 'hooks/datafiles';
import DataFilesListing from '../DataFilesListing/DataFilesListing';
import styles from './DataFilesProjectFileListing.module.scss';

const DataFilesProjectFileListing = ({ system, path }) => {
  const dispatch = useDispatch();
  const { fetchListing } = useFileListing('FilesListing');
  useEffect(() => {
    dispatch({
      type: 'PROJECTS_GET_METADATA',
      payload: system,
    });
  }, [system]);

  useEffect(() => {
    fetchListing({ api: 'tapis', scheme: 'projects', system, path });
  }, [system, path, fetchListing]);

  const metadata = useSelector((state) => state.projects.metadata);

  const editable = useSelector((state) => {
    const projectSystem = state.systems.storage.configuration.find(
      (s) => s.scheme === 'projects'
    );

    const privilegeRequired = projectSystem && projectSystem.privilegeRequired;

    return (
      !privilegeRequired ||
      metadata.members.some((member) => {
        return (
          member.access === 'owner' &&
          member.user &&
          member.user.username === state.authenticatedUser.user.username
        );
      })
    );
  });

  const isUserOrGuest = useSelector(
    (state) =>
      metadata.members
        .filter((member) =>
          member.user
            ? member.user.username === state.authenticatedUser.user.username
            : { access: null }
        )
        .map((currentUser) => currentUser.access === 'edit')[0]
  );
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
      header={<div className={styles.title}>{metadata.title}</div>}
      headerActions={
        editable && (
          <div className={styles.controls}>
            {!isUserOrGuest ? (
              <>
                <Button type="link" onClick={onEdit}>
                  Edit Descriptions
                </Button>
                <span className={styles.separator}>|</span>
              </>
            ) : null}
            <Button type="link" onClick={onManage}>
              {isUserOrGuest ? 'View' : 'Manage'} Team
            </Button>
          </div>
        )
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
        {metadata.description && <ShowMore>{metadata.description}</ShowMore>}
      </div>
      <DataFilesListing
        api="tapis"
        scheme="projects"
        system={system}
        path={path || '/'}
      />
    </SectionTableWrapper>
  );
};

DataFilesProjectFileListing.propTypes = {
  system: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
};

export default DataFilesProjectFileListing;
