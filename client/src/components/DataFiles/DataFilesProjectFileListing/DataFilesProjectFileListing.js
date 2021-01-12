import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import { LoadingSpinner, SectionMessage, SectionTable } from '_common';
import DataFilesListing from '../DataFilesListing/DataFilesListing';
import DataFilesSearchbar from '../DataFilesSearchbar/DataFilesSearchbar';
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
    <SectionTable
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
      <>
        {/* WARNING: This unique description element could become (A) part of the <SectionTable>'s header (thus becoming part of the <SectionHeader>), (B) an independent component <SectionDescription>, or (C) both "A" and "B" */}
        <div styleName="description">{metadata.description}</div>
        <DataFilesSearchbar
          api="tapis"
          scheme="projects"
          system={system}
          styleName="searchbar"
        />
        <div className="o-flex-item-table-wrap">
          <DataFilesListing
            api="tapis"
            scheme="projects"
            system={system}
            path={path || '/'}
          />
        </div>
      </>
    </SectionTable>
  );
};

DataFilesProjectFileListing.propTypes = {
  system: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired
};

export default DataFilesProjectFileListing;
