import React from 'react';
import {
  useHistory,
  useLocation,
  NavLink as RRNavLink,
} from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Modal, ModalHeader, ModalBody, NavLink } from 'reactstrap';
import {
  Button,
  DescriptionList,
  LoadingSpinner,
  Expand,
  Message,
} from '_common';
import PropTypes from 'prop-types';
import { formatDateTime } from 'utils/timeFormat';
import { isOutputState } from 'utils/jobsUtil';
import { getStatusText } from '../../Jobs/JobsStatus';

import * as ROUTES from '../../../constants/routes';
import styles from './JobHistoryModal.module.scss';
import './JobHistoryModal.css';

const placeHolder = '...';

function DataFilesLink({ path, children, disabled }) {
  const text = children || path;
  return (
    <NavLink
      tag={RRNavLink}
      to={`${ROUTES.WORKBENCH}${ROUTES.DATA}/tapis/private/${path}`}
      className={styles.link}
      disabled={disabled}
    >
      {text}
    </NavLink>
  );
}

DataFilesLink.propTypes = {
  path: PropTypes.string.isRequired,
  children: PropTypes.string,
  disabled: PropTypes.bool,
};

DataFilesLink.defaultProps = {
  children: null,
  disabled: false,
};

const reduceInputParameters = (data) =>
  data.reduce((acc, item) => {
    acc[item.label] = item.value;
    return acc;
  }, {});

function JobHistoryContent({
  jobDetails,
  jobDisplay,
  jobName,
  toggle,
  version,
}) {
  const dispatch = useDispatch();
  const outputLocation =
    version === 'v3'
      ? useSelector((state) => {
          const job = state.jobs.list.find(
            (job) => job.uuid === jobDetails.uuid
          );
          return job.outputLocation ? job.outputLocation : '';
        })
      : `${jobDetails.archiveSystem}/${jobDetails.archivePath}`;
  const created = formatDateTime(new Date(jobDetails.created));
  const lastUpdated = formatDateTime(new Date(jobDetails.lastUpdated));
  const hasFailedStatus = jobDetails.status === 'FAILED';
  const hideDataFiles = useSelector(
    (state) => state.workbench.config.hideDataFiles
  );

  const statusDataObj = {
    Submitted: created,
    [`${getStatusText(jobDetails.status)}`]: lastUpdated,
  };

  const inputAndParamsDataObj = {
    ...reduceInputParameters(jobDisplay.inputs),
    ...reduceInputParameters(jobDisplay.parameters),
  };
  const configDataObj = {};
  const outputDataObj = {
    'Job Name': jobName,
    'Output Location': outputLocation,
  };

  statusDataObj[hasFailedStatus ? 'Failure Report' : 'Last Status Message'] = (
    <Expand
      detail={hasFailedStatus ? 'Last Status Message' : 'System Output'}
      message={
        <pre>
          $
          {version === 'v3'
            ? jobDetails.lastMessage
            : jobDetails.lastStatusMessage}
        </pre>
      }
    />
  );

  const resubmitJob = () => {
    dispatch({
      type: 'SUBMIT_JOB',
      payload: {
        job_uuid: jobDetails.uuid,
        action: 'resubmit',
        onSuccess: {
          type: 'GET_JOBS',
          params: {
            offset: 0,
          },
        },
      },
    });
    toggle();
  };

  if ('queue' in jobDisplay) {
    configDataObj.Queue = jobDisplay.queue;
  }

  if (version === 'v3') {
    configDataObj['Max Minutes'] = jobDetails.maxMinutes;
  } else {
    configDataObj['Max Hours'] = jobDetails.maxHours;
  }

  if ('coresPerNode' in jobDisplay) {
    configDataObj['Cores On Each Node'] = jobDisplay.coresPerNode;
  }

  if ('processorsPerNode' in jobDisplay && version === 'v2') {
    configDataObj['Processors On Each Node'] = jobDisplay.processorsPerNode;
  }

  if ('nodeCount' in jobDisplay) {
    configDataObj['Node Count'] = jobDisplay.nodeCount;
  }
  if ('allocation' in jobDisplay) {
    configDataObj.Allocation = jobDisplay.allocation;
  }

  if (jobDetails.status !== 'FINISHED') {
    if (version === 'v3') {
      configDataObj['Execution Directory'] = jobDetails.execSystemExecDir;
      configDataObj['Input Directory'] = jobDetails.execSystemInputDir;
      configDataObj['Output Directory'] = jobDetails.execSystemOutputDir;
    } else {
      configDataObj['Temporary Working Directory'] = jobDetails.workPath;
    }
  }

  const isTerminalState =
    jobDetails.status === 'FINISHED' ||
    jobDetails.status === 'FAILED' ||
    jobDetails.status === 'STOPPED';

  const data = {
    Status: <DescriptionList data={statusDataObj} />,
    Inputs: <DescriptionList data={inputAndParamsDataObj} />,
    Configuration: <DescriptionList data={configDataObj} />,
    Output: <DescriptionList data={outputDataObj} />,
  };

  return (
    <>
      <div className={`${styles['left-panel']} ${styles['panel-content']}`}>
        <DescriptionList
          density="compact"
          data={{
            Output: !hideDataFiles && (
              <DataFilesLink
                path={outputLocation}
                disabled={!isOutputState(jobDetails.status)}
              >
                View in Data Files
              </DataFilesLink>
            ),
          }}
        />
        {isTerminalState && version === 'v3' && (
          <Button
            type="primary"
            attr="submit"
            className={styles['submit-button']}
            onClick={resubmitJob}
          >
            Resubmit Job
          </Button>
        )}
      </div>
      <DescriptionList
        className={`${styles['right-panel']} ${styles['panel-content']}`}
        data={data}
      />
    </>
  );
}

JobHistoryContent.propTypes = {
  jobName: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  jobDetails: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  jobDisplay: PropTypes.object.isRequired,
  toggle: PropTypes.func.isRequired,
  version: PropTypes.string.isRequired,
};
JobHistoryContent.defaultProps = {
  jobName: '',
  jobDisplay: {},
};

function JobHistoryModal({ uuid, version }) {
  const { loading, loadingError, job, display } = useSelector((state) => {
    if (version === 'v3') {
      const job = state.jobDetail;
      return {
        loading: job.loading,
        loadingError: job.loadingError,
        job: job.job,
        display: job.display,
      };
    } else {
      const jobv2 = state.jobsv2.list.find((job) => job.id === uuid);
      return {
        loading: false,
        loadingError: null,
        job: jobv2,
        display: jobv2.display,
      };
    }
  });
  let jobName = job ? job.name : placeHolder;

  if (jobName === placeHolder) {
    if (state && state.jobName) {
      jobName = state.jobName;
    }
  }

  const history = useHistory();
  const close = () => {
    history.push(`${ROUTES.WORKBENCH}${ROUTES.HISTORY}${ROUTES.JOBS}`, {
      fromJobHistoryModal: true,
    });
  };

  const headerData = {
    ...(version === 'v3' ? { 'Job UUID': uuid } : { 'Job ID': uuid }),
    Application: display ? display.applicationName : placeHolder,
    System: display ? display.systemName : placeHolder,
  };

  return (
    <Modal
      isOpen
      className={`${styles.root} job-history-modal`}
      toggle={close}
      size="lg"
    >
      <ModalHeader className={styles.header} toggle={close} charCode="&#xe912;">
        <div className="d-inline-block text-truncate">{jobName}</div>
        <DescriptionList
          data={headerData}
          direction="horizontal"
          className={styles['header-details']}
        />
      </ModalHeader>

      <ModalBody>
        <div className={styles['modal-body-container']}>
          {loading && <LoadingSpinner />}
          {loadingError && (
            <Message type="warn" className={styles.error}>
              Unable to retrieve job information.
            </Message>
          )}
          {!loading && !loadingError && job && (
            <JobHistoryContent
              jobName={jobName}
              jobDetails={job}
              jobDisplay={display}
              toggle={close}
              version={version}
            />
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}

JobHistoryModal.propTypes = {
  uuid: PropTypes.string.isRequired,
  version: PropTypes.string.isRequired,
};

export default JobHistoryModal;
