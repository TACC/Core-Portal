import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import { LoadingSpinner, SectionMessage, SectionTableWrapper } from '_common';
import DataFilesListing from '../DataFilesListing/DataFilesListing';
import './DataFilesProjectFileListing.module.scss';

const DataFilesProjectFileListing = ({ system, path }) => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({
      type: 'PROJECTS_GET_METADATA',
      payload: system
    });
  }, [system]);

  const metadata = useSelector(state => state.projects.metadata);

  const onEdit = () => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'editproject', props: {} }
    });
  };

  const onManage = () => {
    dispatch({
      type: 'USERS_CLEAR_SEARCH'
    });
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'manageproject', props: {} }
    });
  };

  if (metadata.loading) {
    return (
      <div styleName="root-placeholder">
        <LoadingSpinner />
      </div>
    );
  }

  if (metadata.error) {
    return (
      <div styleName="root-placeholder">
        <SectionMessage type="warning">
          We were unable to retrieve this shared workspace.
        </SectionMessage>
      </div>
    );
  }

  return (
    /* !!!: Temporary bad indentation to make simpler PR diff */
    /* eslint-disable prettier/prettier */
    <SectionTableWrapper
      styleName="root"
      header={metadata.title}
      headerActions={
        <div styleName="controls">
          <Button color="link" styleName="edit" onClick={onEdit}>
            Edit Descriptions
          </Button>
          <span styleName="separator">|</span>
          <Button color="link" styleName="edit" onClick={onManage}>
            Manage Team
          </Button>
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
      <div styleName="description">{metadata.description}</div>
      <DataFilesListing
        api="tapis"
        scheme="projects"
        system={system}
        path={path || '/'}
      />
    </SectionTableWrapper>
    /* eslint-enable prettier/prettier */
  );
};

DataFilesProjectFileListing.propTypes = {
  system: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired
};

export default DataFilesProjectFileListing;
