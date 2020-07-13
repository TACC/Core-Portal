import React from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { LoadingSpinner } from '_common';
import PropTypes from 'prop-types';
import * as ROUTES from '../../constants/routes';
import './JobHistoryModal.module.scss';

function JobHistoryContent({ details }) {
  return (
    <div styleName="container">
      <div styleName="panel"></div>
      <div>
        Something2
        <div>
          Status Submitted: {details.created} {details.status} {details.lastUpdated}
        </div>
        <div>
          Failure Report:
        </div>
        <div>
          Inputs
              Working Directory: {details.path}
        </div>
        <div>
          Parameters
          Working Directory: {details.path}
        </div>
        <div>
          Max Hours
          Working Directory: {details.path}
        </div>
      </div>
    </div>

  );
}

JobHistoryContent.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  details: PropTypes.object.isRequired
};

function JobHistoryModal({ jobId }) {
  const loading = useSelector(state => state.jobDetail.loading);
  const loadingError = useSelector(state => state.jobDetail.loadingError);
  const loadingErrorMessage = useSelector(
    state => state.jobDetail.loadingErrorMessage
  );
  const jobDetail = useSelector(state => state.jobDetail.content);
  const jobName = jobDetail ? jobDetail.name : '-------';
  const appId = jobDetail ? jobDetail.appId : '-------';
  const systemId = jobDetail ? jobDetail.systemId : '-------';

  const history = useHistory();
  const close = () => {
    history.push(`${ROUTES.WORKBENCH}${ROUTES.HISTORY}`);
  };

  return (
    <Modal className="job-history-model" isOpen toggle={close} size="lg">
      <ModalHeader className="job-history-model--header" toggle={close}>
        <span> {jobName} </span>
        <div>
          Job ID: {jobId} | Application: {appId} | System: {systemId}
        </div>
      </ModalHeader>

      <ModalBody className="job-history-model--body">
        {loading && <LoadingSpinner />}
        /*
        {loadingError && <Something/>}
        */
        {!loading && <JobHistoryContent details={jobDetail} />}
      </ModalBody>
    </Modal>
  );
}

JobHistoryModal.propTypes = {
  jobId: PropTypes.string.isRequired,
};

export default JobHistoryModal;
