import React, { useState } from 'react';
import { Button, FormGroup, Alert } from 'reactstrap';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { Formik, Form } from 'formik';
import { AppIcon, FormField, Icon, LoadingSpinner, Message } from '_common';
import * as Yup from 'yup';
import parse from 'html-react-parser';
import './AppForm.scss';
import SystemsPushKeysModal from '_common/SystemsPushKeysModal';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import FormSchema from './AppFormSchema';
import { getMaxQueueRunTime, createMaxRunTimeRegex } from './AppFormUtils';
import DataFilesSelectModal from '../../DataFiles/DataFilesModals/DataFilesSelectModal';
import { getSystemName } from 'utils/jobsUtil';
import * as ROUTES from '../../../constants/routes';

const appShape = PropTypes.shape({
  id: PropTypes.string,
  label: PropTypes.string,
  longDescription: PropTypes.string,
  helpURI: PropTypes.string,
  resource: PropTypes.string,
  defaultQueue: PropTypes.string,
  exec_sys: PropTypes.shape({
    queues: PropTypes.arrayOf(PropTypes.shape({}))
  }),
  defaultNodeCount: PropTypes.number,
  parallelism: PropTypes.string,
  defaultProcessorsPerNode: PropTypes.number,
  defaultMaxRunTime: PropTypes.string,
  scheduler: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.string)
});

export const AppPlaceholder = ({ apps }) => {
  return (
    <div className="apps-placeholder">
      {apps
        ? `Select an app from the tray above to submit a job.`
        : `No apps to show.`}
    </div>
  );
};
AppPlaceholder.propTypes = {
  apps: PropTypes.bool.isRequired
};

const AppDetail = () => {
  const { loading, app, error, allocationsLoading } = useSelector(
    state => ({
      loading: state.app.loading,
      app: state.app.definition,
      error: state.app.error,
      allocationsLoading: state.allocations.loading
    }),
    shallowEqual
  );

  if (error.isError) {
    const errorText = error.message ? error.message : 'Something went wrong.';

    return (
      <Message type="warn" className="appDetail-error">
        {errorText}
      </Message>
    );
  }

  if (loading || !app.name || allocationsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div id="appDetail-wrapper">
      {!app.name && <AppPlaceholder />}
      {app.value && app.value.type === 'html' ? (
        parse(app.value.definition.html)
      ) : (
        <>
          <AppInfo app={app} />
          <AppSchemaForm app={app} />
        </>
      )}
    </div>
  );
};

const AppInfo = ({ app }) => {
  return (
    <div className="appInfo-wrapper">
      <h5 className="appInfo-title">{app.label}</h5>
      <div className="appInfo-description">
        {parse(app.longDescription || '')}
      </div>
      {app.helpURI ? (
        <a
          className="wb-link appInfo-documentation"
          href={app.helpURI}
          target="_blank"
          rel="noreferrer noopener"
        >
          <AppIcon appId={app.id} /> <span>{app.label} Documentation</span>
        </a>
      ) : null}
      <SystemsPushKeysModal />
    </div>
  );
};
AppInfo.propTypes = {
  app: appShape.isRequired
};

export const AppSchemaForm = ({ app }) => {
  const dispatch = useDispatch();
  const {
    allocations,
    portalAlloc,
    jobSubmission,
    hasDefaultAllocation,
    defaultHost
  } = useSelector(state => {
    const matchingHost = Object.keys(state.allocations.hosts).find(
      host => app.resource === host || app.resource.endsWith(`.${host}`)
    );
    return {
      allocations: matchingHost ? state.allocations.hosts[matchingHost] : [],
      portalAlloc: state.allocations.portal_alloc,
      jobSubmission: state.jobs.submit,
      hasDefaultAllocation: !state.allocations.loading
        ? state.allocations.hosts[state.systems.defaultHost]
        : true,
      defaultHost: state.systems.defaultHost
    };
  }, shallowEqual);

  const appFields = FormSchema(app);

  // initial form values
  const initialValues = {
    ...appFields.defaults,
    name: `${app.id}_${new Date().toISOString().split('.')[0]}`,
    batchQueue: (
      (app.defaultQueue
        ? app.exec_sys.queues.find(q => q.name === app.defaultQueue)
        : app.exec_sys.queues.find(q => q.default === true)) ||
      app.exec_sys.queues[0]
    ).name,
    nodeCount: app.defaultNodeCount,
    processorsOnEachNode:
      app.parallelism === 'PARALLEL'
        ? Math.floor(app.defaultProcessorsPerNode / app.defaultNodeCount)
        : 1,
    maxRunTime: app.defaultMaxRunTime || '',
    archivePath: '',
    archive: true,
    archiveOnAppError: true,
    appId: app.id
  };

  if (app.scheduler === 'SLURM') {
    if (allocations.includes(portalAlloc)) {
      initialValues.allocation = portalAlloc;
    } else {
      initialValues.allocation = allocations.length === 1 ? allocations[0] : '';
    }

    if (!hasDefaultAllocation) {
      jobSubmission.error = true;
      jobSubmission.response = {
        message: `You need an allocation on ${getSystemName(defaultHost)} to run this application. Please submit a ticket for access.`
      };
    } else if (!allocations.length) {
      jobSubmission.error = true;
      jobSubmission.response = {
        message: `You need an allocation to use the system ${app.resource}. Please submit a ticket for access.`
      };
    }
  } else {
    initialValues.allocation = app.scheduler;
  }

  // local state for alerts
  const [visible, setVisible] = useState(true);
  const onDismiss = () => setVisible(false);

  return (
    <div id="appForm-wrapper">
      {jobSubmission.response && (
        <div id="appForm-alerts">
          {jobSubmission.error ? (
            <Alert color="warning" isOpen={visible} toggle={onDismiss}>
              {`Error:  ${jobSubmission.response.message}`}
            </Alert>
          ) : (
            <Alert color="info" isOpen={visible} toggle={onDismiss}>
              Your job has submitted successfully. See details in{' '}
              <Link
                to={`${ROUTES.WORKBENCH}${ROUTES.HISTORY}/jobs`}
                className="wb-link"
              >
                History &gt; Jobs
              </Link>
              .
            </Alert>
          )}
        </div>
      )}
      <Formik
        initialValues={initialValues}
        validationSchema={props => {
          return Yup.lazy(values => {
            const queue = app.exec_sys.queues.find(
              q => q.name === values.batchQueue
            );
            const maxQueueRunTime = getMaxQueueRunTime(app, values.batchQueue);
            const schema = Yup.object({
              parameters: Yup.object({ ...appFields.schema.parameters }),
              inputs: Yup.object({ ...appFields.schema.inputs }),
              name: Yup.string()
                .max(64, 'Must be 64 characters or less')
                .required('Required'),
              batchQueue: Yup.string()
                .required('Required')
                .oneOf(app.exec_sys.queues.map(q => q.name)),
              nodeCount: Yup.number()
                .min(1)
                .max(queue.maxNodes),
              processorsOnEachNode: Yup.number()
                .min(1)
                .max(
                  Math.floor(queue.maxProcessorsPerNode / queue.maxNodes) || 1
                ),
              maxRunTime: Yup.string()
                .matches(
                  createMaxRunTimeRegex(maxQueueRunTime),
                  `Must be in format HH:MM:SS and not exceed ${maxQueueRunTime} (hrs:min:sec).`
                )
                .required('Required'),
              archivePath: Yup.string(),
              allocation: Yup.string()
                .required('Required')
                .oneOf(
                  allocations.concat([app.scheduler]),
                  'Please select an allocation from the dropdown.'
                )
            });
            return schema;
          });
        }}
        onSubmit={(values, { setSubmitting, resetForm }) => {
          const job = { ...values };
          /* To ensure that DCV server is alive, name of job needs to contain 'dcvserver' */
          if (app.tags.includes('DCV')) {
            job.name += '-dcvserver';
          }
          dispatch({
            type: 'SUBMIT_JOB',
            payload: job
          });
        }}
        // enableReinitialize
      >
        {({
          values,
          errors,
          touched,
          setFieldTouched,
          handleChange,
          handleBlur,
          handleSubmit,
          setFieldValue,
          isSubmitting,
          handleReset,
          resetForm,
          setSubmitting
        }) => {
          if (
            jobSubmission.response &&
            jobSubmission.submitting &&
            isSubmitting
          ) {
            setSubmitting(false);
            resetForm(initialValues);
            const formTop = document.getElementById('appForm-wrapper');
            formTop.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
            dispatch({ type: 'TOGGLE_SUBMITTING' });
          }
          const readOnly =
            jobSubmission.submitting ||
            (app.scheduler === 'SLURM' && !allocations.length);
          return (
            <Form>
              <FormGroup tag="fieldset" disabled={readOnly}>
                <div className="appSchema-section">
                  <div className="appSchema-header">
                    <span>Inputs</span>
                  </div>
                  {Object.entries(appFields.inputs).map(([id, field]) => {
                    return (
                      <FormField
                        {...field}
                        name={`inputs.${id}`}
                        agaveFile
                        SelectModal={DataFilesSelectModal}
                        placeholder="Browse Data Files"
                        key={`inputs.${id}`}
                      />
                    );
                  })}
                  {Object.entries(appFields.parameters).map(([id, field]) => {
                    return (
                      <FormField
                        {...field}
                        name={`parameters.${id}`}
                        key={`parameters.${id}`}
                      >
                        {field.options
                          ? field.options.map(item => {
                              let val = item;
                              if (val instanceof String) {
                                const tmp = {};
                                tmp[val] = val;
                                val = tmp;
                              }
                              return Object.entries(val).map(([key, value]) => (
                                <option key={key} value={key}>
                                  {value}
                                </option>
                              ));
                            })
                          : null}
                      </FormField>
                    );
                  })}
                </div>
                <div className="appSchema-section">
                  <div className="appSchema-header">
                    <span>Configuration</span>
                  </div>
                  <FormField
                    label="Queue"
                    name="batchQueue"
                    description="Select the queue this job will execute on."
                    type="select"
                    required
                  >
                    {app.exec_sys.queues
                      .map(q => q.name)
                      .sort()
                      .map(queue => (
                        <option key={queue} value={queue}>
                          {queue}
                        </option>
                      ))
                      .sort()}
                  </FormField>
                  {!app.tags.includes('Interactive') ? (
                    <FormField
                      label="Maximum Job Runtime"
                      description={`The maximum time you expect this job to run for. Maximum possible time is ${getMaxQueueRunTime(
                        app,
                        values.batchQueue
                      )} (hrs:min:sec). After this amount of time your job will end. Shorter run times result in shorter queue wait times.`}
                      name="maxRunTime"
                      type="text"
                      placeholder="HH:MM:SS"
                      required
                    />
                  ) : null}
                  {app.parallelism === 'PARALLEL' ? (
                    <>
                      <FormField
                        label="Processors On Each Node"
                        description="Number of processors (cores) per node for the job. e.g. a selection of 16 processors per node along with 4 nodes will result in 16 processors on 4 nodes, with 64 processors total."
                        name="processorsOnEachNode"
                        type="number"
                      />
                      <FormField
                        label="Node Count"
                        description="Number of requested process nodes for the job."
                        name="nodeCount"
                        type="number"
                      />
                    </>
                  ) : null}
                  {app.scheduler === 'SLURM' ? (
                    <FormField
                      label="Allocation"
                      name="allocation"
                      description="Select the project allocation you would like to use with this job submission."
                      type="select"
                      required
                    >
                      <option hidden disabled>
                        {' '}
                      </option>
                      {allocations.sort().map(projectId => (
                        <option key={projectId} value={projectId}>
                          {projectId}
                        </option>
                      ))}
                    </FormField>
                  ) : null}
                </div>
                <div className="appSchema-section">
                  <div className="appSchema-header">
                    <span>Output</span>
                  </div>
                  <FormField
                    label="Job Name"
                    description="A recognizable name for this job."
                    name="name"
                    type="text"
                    required
                  />
                  {!app.tags.includes('Interactive') ? (
                    <FormField
                      label="Output Location"
                      description={parse(
                        'Specify a location where the job output should be archived. By default, job output will be archived at: <code>archive/jobs/${YYYY-MM-DD}/${JOB_NAME}-${JOB_ID}</code>.' // eslint-disable-line no-template-curly-in-string
                      )}
                      name="archivePath"
                      type="text"
                      placeholder="archive/jobs/${YYYY-MM-DD}/${JOB_NAME}-${JOB_ID}" // eslint-disable-line no-template-curly-in-string
                    />
                  ) : null}
                </div>
                <Button type="submit" color="primary">
                  {jobSubmission.submitting && (
                    <LoadingSpinner placement="inline" />
                  )}{' '}
                  {(Object.keys(errors).length || jobSubmission.error) && (
                    <Icon name="alert">Warning</Icon>
                  )}{' '}
                  <span>Submit</span>
                </Button>
                <Button
                  onClick={handleReset}
                  className="btn-resetForm"
                  color="link"
                >
                  <h6>Reset Fields to Defaults</h6>
                </Button>
              </FormGroup>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};
AppSchemaForm.propTypes = {
  app: appShape.isRequired
};

export default AppDetail;
