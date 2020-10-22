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
import { formatDateTime } from 'utils/timeFormat';
import { isOutputState } from 'utils/jobsUtil';
import { getStatusText } from '../../Jobs/JobsStatus';

import * as ROUTES from '../../../constants/routes';
import './JobHistoryModal.module.scss';
import './JobHistoryModal.css';

const placeHolder = '...';

function DataFilesLink({ path, children, disabled }) {
  const text = children || path;
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
  children: PropTypes.string,
  disabled: PropTypes.bool
};

DataFilesLink.defaultProps = {
  children: null,
  disabled: false
};

const reduceInputParameters = data =>
  data.reduce((acc, item) => {
    acc[item.label] = item.value;
    return acc;
  }, {});

function JobHistoryContent({ jobDetails, jobDisplay, jobName }) {
  const outputPath = `${jobDetails.archiveSystem}/${jobDetails.archivePath}`;
  const created = formatDateTime(new Date(jobDetails.created));
  const lastUpdated = formatDateTime(new Date(jobDetails.lastUpdated));
  const hasFailedStatus = jobDetails.status === 'FAILED';

  const statusDataObj = {
    Submitted: created,
    [`${getStatusText(jobDetails.status)}`]: lastUpdated
  };
  const inputAndParamsDataObj = {
    ...reduceInputParameters(jobDisplay.inputs),
    ...reduceInputParameters(jobDisplay.parameters)
  };
  const configDataObj = {};
  const outputDataObj = {
    'Job Name': jobName,
    'Output Location': outputPath
  };

  statusDataObj[hasFailedStatus ? 'Failure Report' : 'Last Status Message'] = (
    <Expand
      detail={hasFailedStatus ? 'Last Status Message' : 'System Output'}
      message={<pre>${jobDetails.lastStatusMessage}</pre>}
    />
  );

  if ('queue' in jobDisplay) {
    configDataObj.Queue = jobDisplay.queue;
  }

  configDataObj['Max Hours'] = jobDetails.maxHours;

  if ('processorsPerNode' in jobDisplay) {
    configDataObj['Processors On Each Node'] = jobDisplay.processorsPerNode;
  }
  if ('nodeCount' in jobDisplay) {
    configDataObj['Node Count'] = jobDisplay.nodeCount;
  }
  if ('allocation' in jobDisplay) {
    configDataObj.Allocation = jobDisplay.allocation;
  }

  if (jobDetails.status !== 'FINISHED')
    configDataObj['Temporary Working Directory'] = jobDetails.workPath;

  const data = {
    Status: <DescriptionList data={statusDataObj} />,
    Inputs: <DescriptionList data={inputAndParamsDataObj} />,
    Configuration: <DescriptionList data={configDataObj} />,
    Output: <DescriptionList data={outputDataObj} />
  };

  return (
    <>
      <DescriptionList
        styleName="left-panel panel-content"
        density="compact"
        data={{
          Output: (
            <DataFilesLink
              path={outputPath}
              disabled={!isOutputState(jobDetails.status)}
            >
              View in Data Files
            </DataFilesLink>
          )
        }}
      />
      <DescriptionList styleName="right-panel panel-content" data={data} />
    </>
  );
}

JobHistoryContent.propTypes = {
  jobName: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  jobDetails: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  jobDisplay: PropTypes.object.isRequired
};
JobHistoryContent.defaultProps = {
  jobName: ''
};

function JobHistoryModal({ jobId }) {
  const loading = useSelector(state => state.jobDetail.loading);
  const loadingError = useSelector(state => state.jobDetail.loadingError);
  const { job, display } = useSelector(state => state.jobDetail);
  const { state } = useLocation();

  let jobName = job ? job.name : placeHolder;

  if (jobName === placeHolder) {
    if (state && state.jobName) {
      jobName = state.jobName;
    }
  }

  const history = useHistory();
  const close = () => {
    history.push(`${ROUTES.WORKBENCH}${ROUTES.HISTORY}${ROUTES.JOBS}`, {
      fromJobHistoryModal: true
    });
  };

  const headerData = {
    'Job ID': jobId,
    Application: display ? display.applicationName : placeHolder,
    System: display ? display.systemName : placeHolder
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

      <ModalBody>
        <div styleName="modal-body-container">
          {loading && <LoadingSpinner />}
          {loadingError && (
            <Message type="warn" styleName="error">
              Unable to retrieve job information.
            </Message>
          )}
          {!loading && !loadingError && (
            <JobHistoryContent
              jobName={jobName}
              jobDetails={job}
              jobDisplay={display}
            />
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
