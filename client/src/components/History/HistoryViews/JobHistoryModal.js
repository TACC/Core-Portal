import React from 'react';
import {
  useHistory,
  useLocation,
  NavLink as RRNavLink
} from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Modal, ModalHeader, ModalBody, NavLink } from 'reactstrap';
import { DescriptionList, LoadingSpinner, Expand, Message } from '_common';
import PropTypes from 'prop-types';
import { getOutputPathFromHref } from 'utils/jobsUtil';
import { formatDateTime } from 'utils/timeFormat';
import { getStatusText } from '../../Jobs/JobsStatus';

import * as ROUTES from '../../../constants/routes';
import './JobHistoryModal.module.scss';
import './JobHistoryModal.css';

const placeHolder = '...';

function DataFilesLink({ path, displayText, disabled }) {
  const text = displayText || path;
  return (
    <NavLink
      tag={RRNavLink}
      to={`${ROUTES.WORKBENCH}${ROUTES.DATA}/tapis/private/${path}`}
      styleName="link"
      disabled={disabled}
    >
      {text}
    </NavLink>
  );
}

DataFilesLink.propTypes = {
  path: PropTypes.string.isRequired,
  displayText: PropTypes.string,
  disabled: PropTypes.bool
};

DataFilesLink.defaultProps = {
  displayText: null,
  disabled: false
};

const reduceInputParameters = data =>
  data.reduce((acc, item) => {
    acc[item.label] = item.value;
    return acc;
  }, {});

function JobHistoryContent({ jobDetails, jobDisplay }) {
  const outputPath = getOutputPathFromHref(jobDetails._links.archiveData.href);
  const created = formatDateTime(new Date(jobDetails.created));
  const lastUpdated = formatDateTime(new Date(jobDetails.lastUpdated));
  const failureStates = ['FAILED', 'BLOCKED'];
  const isFailed = failureStates.includes(jobDetails.status);
  const statusDataObj = {
    Submitted: created,
    [`${getStatusText(jobDetails.status)}`]: lastUpdated
  };
  const inputAndParamsDataObj = {
    ...reduceInputParameters(jobDisplay.inputs),
    ...reduceInputParameters(jobDisplay.parameters)
  };

  const data = {
    Status: <DescriptionList data={statusDataObj} />,
    Inputs: <DescriptionList data={inputAndParamsDataObj} />
  };

  if (isFailed) {
    data.FailureReport = (
      <Expand detail="Failure Report" message={jobDetails.lastStatusMessage} />
    );
  }

  data['Max Hours'] = jobDetails.maxHours;

  if ('processorsPerNode' in jobDisplay) {
    data['Processors On Each Node'] = jobDisplay.processorsPerNode;
  }
  if ('nodeCount' in jobDisplay) {
    data['Node Count'] = jobDisplay.nodeCount;
  }
  if ('queue' in jobDisplay) {
    data.Queue = jobDisplay.queue;
  }
  if ('allocation' in jobDisplay) {
    data.Allocation = jobDisplay.allocation;
  }

  return (
    <>
      <div styleName="left-panel panel-content">
        <div styleName="label">Output</div>
        <DataFilesLink
          path={outputPath}
          displayText="View in Data Files"
          disabled={outputPath === null}
        />
      </div>
      <div styleName="right-panel panel-content">
        <dl>
          <dd>
            <DescriptionList data={data} />
          </dd>
        </dl>
      </div>
    </>
  );
}

JobHistoryContent.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  jobDetails: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  jobDisplay: PropTypes.object.isRequired
};

function JobHistoryModal({ jobId }) {
  const loading = useSelector(state => state.jobDetail.loading);
  const loadingError = useSelector(state => state.jobDetail.loadingError);
  const { job, display } = useSelector(state => state.jobDetail);
  const { search } = useLocation();

  const applicationName = display ? display.applicationName : placeHolder;
  const systemName = display ? display.systemName : placeHolder;
  let jobName = job ? job.name : placeHolder;

  if (jobName === placeHolder) {
    const jobNameFromQuery = new URLSearchParams(search).get('name');
    if (jobNameFromQuery) {
      jobName = jobNameFromQuery;
    }
  }

  const history = useHistory();
  const close = () => {
    history.push(`${ROUTES.WORKBENCH}${ROUTES.HISTORY}`);
  };

  const headerData = {
    'Job ID': jobId,
    Application: applicationName,
    System: systemName
  };

  return (
    <Modal
      isOpen
      styleName="root"
      className="job-history-modal"
      toggle={close}
      size="lg"
    >
      <ModalHeader styleName="header" toggle={close}>
        <div className="d-inline-block text-truncate">{jobName}</div>
        <DescriptionList
          data={headerData}
          direction="horizontal"
          styleName="header-details"
        />
      </ModalHeader>

      <ModalBody className="job-history-model--body">
        <div styleName="modal-body-container">
          {loading && <LoadingSpinner />}
          {loadingError && (
            <Message type="warn" styleName="error">
              Unable to retrieve job information.
            </Message>
          )}
          {!loading && !loadingError && (
            <JobHistoryContent jobDetails={job} jobDisplay={display} />
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}

JobHistoryModal.propTypes = {
  jobId: PropTypes.string.isRequired
};

export default JobHistoryModal;
