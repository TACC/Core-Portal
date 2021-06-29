import React from 'react';
import { Button, FormGroup } from 'reactstrap';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { Formik, Form } from 'formik';
import { cloneDeep } from 'lodash';
import {
  AppIcon,
  FormField,
  Icon,
  LoadingSpinner,
  SectionMessage
} from '_common';
import * as Yup from 'yup';
import parse from 'html-react-parser';
import './AppForm.scss';
import SystemsPushKeysModal from '_common/SystemsPushKeysModal';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { getSystemName } from 'utils/systems';
import FormSchema from './AppFormSchema';
import { getMaxQueueRunTime, createMaxRunTimeRegex } from './AppFormUtils';
import DataFilesSelectModal from '../../DataFiles/DataFilesModals/DataFilesSelectModal';
import * as ROUTES from '../../../constants/routes';

const appShape = PropTypes.shape({
  loading: PropTypes.bool,
  error: PropTypes.shape({}),
  definition: PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string,
    longDescription: PropTypes.string,
    helpURI: PropTypes.string,
    defaultQueue: PropTypes.string,
    defaultNodeCount: PropTypes.number,
    parallelism: PropTypes.string,
    defaultProcessorsPerNode: PropTypes.number,
    defaultMaxRunTime: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string)
  }),
  systemHasKeys: PropTypes.bool,
  pushKeysSystem: PropTypes.shape({}),
  exec_sys: PropTypes.shape({
    login: PropTypes.shape({
      host: PropTypes.string
    }),
    scheduler: PropTypes.string,
    queues: PropTypes.arrayOf(PropTypes.shape({}))
  }),
  license: PropTypes.shape({}),
  appListing: PropTypes.arrayOf(PropTypes.shape({}))
});

export const AppPlaceholder = ({ apps }) => {
  return (
    <div
      id="appDetail-wrapper"
      className="has-message appDetail-placeholder-message"
    >
      {apps
        ? `Select an app from the tray above to submit a job.`
        : `No apps to show.`}
    </div>
  );
};
AppPlaceholder.propTypes = {
  apps: PropTypes.bool.isRequired
};

export const AppDetail = () => {
  const { app, allocationsLoading } = useSelector(
    state => ({
      app: state.app,
      allocationsLoading: state.allocations.loading
    }),
    shallowEqual
  );

  const categoryDict = useSelector(state => state.apps.categoryDict);
  const hasApps = Object.keys(categoryDict).some(
    category => categoryDict[category] && categoryDict[category].length > 0
  );

  if (app.error.isError) {
    const errorText = app.error.message
      ? app.error.message
      : 'Something went wrong.';

    return (
      <div id="appDetail-wrapper" className="has-message  appDetail-error">
        <SectionMessage type="warning">{errorText}</SectionMessage>
      </div>
    );
  }

  if (app.loading || allocationsLoading) {
    return (
      <div id="appDetail-wrapper" className="is-loading  appDetail-error">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      {!app.definition && <AppPlaceholder apps={hasApps} />}
      {app.definition.appType === 'html' ? (
        <div id="appDetail-wrapper" className="has-external-app">
          {parse(app.definition.html)}
        </div>
      ) : (
        <div id="appDetail-wrapper" className="has-internal-app">
          <AppInfo app={app} />
          <AppSchemaForm app={app} />
        </div>
      )}
    </>
  );
};

const AppInfo = ({ app }) => {
  return (
    <div className="appInfo-wrapper">
      <h5 className="appInfo-title">{app.definition.label}</h5>
      <div className="appInfo-description">
        {parse(app.definition.longDescription || '')}
      </div>
      {app.definition.helpURI ? (
        <a
          className="wb-link appInfo-documentation"
          href={app.definition.helpURI}
          target="_blank"
          rel="noreferrer noopener"
        >
          <AppIcon appId={app.definition.id} />{' '}
          <span>{app.definition.label} Documentation</span>
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
    defaultStorageHost
  } = useSelector(state => {
    const matchingExecutionHost = Object.keys(state.allocations.hosts).find(
      host =>
        app.exec_sys.login.host === host ||
        app.exec_sys.login.host.endsWith(`.${host}`)
    );
    const { defaultHost } = state.systems.storage;
    const hasCorral = [
      'cloud.corral.tacc.utexas.edu',
      'data.tacc.utexas.edu'
    ].some(s => defaultHost.endsWith(s));
    return {
      allocations: matchingExecutionHost
        ? state.allocations.hosts[matchingExecutionHost]
        : [],
      portalAlloc: state.allocations.portal_alloc,
      jobSubmission: state.jobs.submit,
      hasDefaultAllocation:
        state.allocations.loading ||
        state.systems.storage.loading ||
        state.allocations.hosts[defaultHost] ||
        hasCorral,
      defaultStorageHost: defaultHost
    };
  }, shallowEqual);

  const { systemHasKeys, pushKeysSystem } = app;

  const pushKeys = e => {
    e.preventDefault();
    dispatch({
      type: 'SYSTEMS_TOGGLE_MODAL',
      payload: {
        operation: 'pushKeys',
        props: {
          system: pushKeysSystem
        }
      }
    });
  };

  const appFields = FormSchema(app);

  // initial form values
  const initialValues = {
    ...appFields.defaults,
    name: `${app.definition.id}_${new Date().toISOString().split('.')[0]}`,
    batchQueue: (
      (app.definition.defaultQueue
        ? app.exec_sys.queues.find(q => q.name === app.definition.defaultQueue)
        : app.exec_sys.queues.find(q => q.default === true)) ||
      app.exec_sys.queues[0]
    ).name,
    nodeCount: app.definition.defaultNodeCount,
    processorsOnEachNode:
      app.definition.parallelism === 'PARALLEL'
        ? Math.floor(
            app.definition.defaultProcessorsPerNode /
              app.definition.defaultNodeCount
          )
        : 1,
    maxRunTime: app.definition.defaultMaxRunTime || '',
    archivePath: '',
    archive: true,
    archiveOnAppError: true,
    appId: app.definition.id
  };

  let missingAllocation = false;
  if (app.exec_sys.scheduler === 'SLURM') {
    if (allocations.includes(portalAlloc)) {
      initialValues.allocation = portalAlloc;
    } else {
      initialValues.allocation = allocations.length === 1 ? allocations[0] : '';
    }
    if (!hasDefaultAllocation) {
      jobSubmission.error = true;
      jobSubmission.response = {
        message: `You need an allocation on ${getSystemName(
          defaultStorageHost
        )} to run this application.`
      };
      missingAllocation = true;
    } else if (!allocations.length) {
      jobSubmission.error = true;
      jobSubmission.response = {
        message: `You need an allocation on ${getSystemName(
          app.exec_sys.login.host
        )} to run this application.`
      };
      missingAllocation = true;
    }
  } else {
    initialValues.allocation = app.exec_sys.scheduler;
  }

  return (
    <div id="appForm-wrapper">
      {!systemHasKeys && (
        <div className="appDetail-error">
          <SectionMessage type="warning">
            There was a problem accessing your default My Data file system. If
            this is your first time logging in, you may need to &nbsp;
            <a
              className="data-files-nav-link"
              type="button"
              href="#"
              onClick={pushKeys}
            >
              push your keys
            </a>
            .
          </SectionMessage>
        </div>
      )}
      {jobSubmission.response && (
        <>
          {jobSubmission.error ? (
            <div className="appDetail-error">
              <SectionMessage type="warning">
                Error: {jobSubmission.response.message}
                {missingAllocation && (
                  <>
                    &nbsp;Please click&nbsp;
                    <Link
                      to="/workbench/allocations/manage"
                      className="wb-link"
                    >
                      here
                    </Link>
                    &nbsp;to request access.
                  </>
                )}
              </SectionMessage>
            </div>
          ) : (
            <div className="appDetail-error">
              <SectionMessage type="success">
                Your job has submitted successfully. See details in{' '}
                <Link
                  to={`${ROUTES.WORKBENCH}${ROUTES.HISTORY}/jobs`}
                  className="wb-link"
                >
                  History &gt; Jobs
                </Link>
                .
              </SectionMessage>
            </div>
          )}
        </>
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
                  allocations.concat([app.exec_sys.scheduler]),
                  'Please select an allocation from the dropdown.'
                )
            });
            return schema;
          });
        }}
        onSubmit={(values, { setSubmitting, resetForm }) => {
          const job = cloneDeep(values);
          /* remove falsy input */
          Object.entries(job.inputs).forEach(([k, v]) => {
            let val = v;
            if (Array.isArray(val)) {
              val = val.filter(Boolean);
              if (val.length === 0) {
                delete job.inputs[k];
              }
            } else if (!val) {
              delete job.inputs[k];
            }
          });
          /* remove falsy parameter */
          // TODO: allow falsy parameters for parameters of type bool
          // Object.entries(job.parameters).forEach(([k, v]) => {
          //   let val = v;
          //   if (Array.isArray(v)) {
          //     val = val.filter(Boolean);
          //     if (val.length === 0) {
          //       delete job.parameters[k];
          //     }
          //   } else if (val === null || val === undefined) {
          //     delete job.parameters[k];
          //   }
          // });
          /* To ensure that DCV server is alive, name of job needs to contain 'dcvserver' */
          if (app.definition.tags.includes('DCV')) {
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
            const formTop = document.getElementById('appBrowser-wrapper');
            formTop.scrollIntoView({ behavior: 'smooth' });
            dispatch({ type: 'TOGGLE_SUBMITTING' });
          }
          const readOnly =
            jobSubmission.submitting ||
            (app.exec_sys.scheduler === 'SLURM' && missingAllocation);
          return (
            <Form>
              <FormGroup tag="fieldset" disabled={readOnly || !systemHasKeys}>
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
                  {!app.definition.tags.includes('Interactive') ? (
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
                  {app.definition.parallelism === 'PARALLEL' ? (
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
                  {app.exec_sys.scheduler === 'SLURM' ? (
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
                  {!app.definition.tags.includes('Interactive') ? (
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
