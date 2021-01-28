import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import { LoadingSpinner, Message, ReadMore } from '_common';
import DataFilesListing from '../DataFilesListing/DataFilesListing';
import './DataFilesProjectFileListing.module.scss';
import './DataFilesProjectListing.scss';

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
    return <LoadingSpinner />;
  }

  if (metadata.error) {
    return (
      <Message type="warn">
        We were unable to retrieve this shared workspace.
      </Message>
    );
  }

  return (
    <div styleName="root">
      <div styleName="title-bar">
        <h6>{metadata.title}</h6>
        <div styleName="controls">
          <Button color="link" styleName="edit" onClick={onEdit}>
            <h6>Edit Descriptions</h6>
          </Button>
          <span styleName="separator">|</span>
          <Button color="link" styleName="edit" onClick={onManage}>
            <h6>Manage Team</h6>
          </Button>
        </div>
      </div>
      <ReadMore className="shared-workspace__description" text={metadata.description} />
      <DataFilesListing
        api="tapis"
        scheme="projects"
        system={system}
        path={path || '/'}
      />
    </div>
  );
};

DataFilesProjectFileListing.propTypes = {
  system: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired
};

export default DataFilesProjectFileListing;
