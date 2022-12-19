import React, { useEffect, useState } from 'react';
import { FormGroup } from 'reactstrap';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { Formik, Form, useFormikContext } from 'formik';
import { cloneDeep } from 'lodash';
import {
  Button,
  AppIcon,
  FormField,
  LoadingSpinner,
  SectionMessage,
} from '_common';
import * as Yup from 'yup';
import parse from 'html-react-parser';
import './AppForm.scss';
import SystemsPushKeysModal from '_common/SystemsPushKeysModal';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { getSystemName } from 'utils/systems';
import FormSchema from './AppFormSchema';
import {
  getQueueMaxMinutes,
  getMaxMinutesValidation,
  getNodeCountValidation,
  getCoresPerNodeValidation,
  getQueueValidation,
  updateValuesForQueue,
} from './AppFormUtils';
import DataFilesSelectModal from '../../DataFiles/DataFilesModals/DataFilesSelectModal';
import * as ROUTES from '../../../constants/routes';

const appShape = PropTypes.shape({
  loading: PropTypes.bool,
  error: PropTypes.shape({}),
  definition: PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string,
    description: PropTypes.string,
    defaultQueue: PropTypes.string,
    nodeCount: PropTypes.number,
    coresPerNode: PropTypes.number,
    maxMinutes: PropTypes.number,
    tags: PropTypes.arrayOf(PropTypes.string),
  }),
  systemNeedsKeys: PropTypes.bool,
  pushKeysSystem: PropTypes.shape({}),
  exec_sys: PropTypes.shape({
    host: PropTypes.string,
    scheduler: PropTypes.string,
    batchLogicalQueues: PropTypes.arrayOf(PropTypes.shape({})),
  }),
  license: PropTypes.shape({
    type: PropTypes.string,
    enabled: PropTypes.bool,
  }),
  appListing: PropTypes.arrayOf(PropTypes.shape({})),
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
  apps: PropTypes.bool.isRequired,
};

export const AppDetail = () => {
  const { app, allocationsLoading } = useSelector(
    (state) => ({
      app: state.app,
      allocationsLoading: state.allocations.loading,
    }),
    shallowEqual
  );

  const categoryDict = useSelector((state) => state.apps.categoryDict);
  const hasApps = Object.keys(categoryDict).some(
    (category) => categoryDict[category] && categoryDict[category].length > 0
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

/**
 * AdjustValuesWhenQueueChanges is a component that makes uses of
 * useFormikContext to ensure that when users switch queues, some
 * variables are updated to match the queue specifications (i.e.
 * correct node count, runtime etc)
 */
const AdjustValuesWhenQueueChanges = ({ app }) => {
  const [previousValues, setPreviousValues] = useState();

  // Grab values and update if queue changes
  const { values, setValues } = useFormikContext();
  React.useEffect(() => {
    if (
      previousValues &&
      previousValues.execSystemLogicalQueue !== values.execSystemLogicalQueue
    ) {
      setValues(updateValuesForQueue(app, values));
    }
    setPreviousValues(values);
  }, [app, values, setValues]);
  return null;
};

const AppInfo = ({ app }) => {
  return (
    <div className="appInfo-wrapper">
      <h5 className="appInfo-title">{app.definition.label}</h5>
      <div className="appInfo-description">
        {parse(app.definition.description || '')}
      </div>
      {app.definition.notes.helpUrl ? (
        <a
          className="wb-link appInfo-documentation"
          href={app.definition.notes.helpUrl}
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
  app: appShape.isRequired,
};

export const AppSchemaForm = ({ app }) => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({ type: 'GET_SYSTEM_MONITOR' });
  }, [dispatch]);
  const {
    allocations,
    portalAlloc,
    jobSubmission,
    hasDefaultAllocation,
    defaultStorageHost,
    hasStorageSystems,
    downSystems,
    execSystem,
  } = useSelector((state) => {
    const matchingExecutionHost = Object.keys(state.allocations.hosts).find(
      (host) =>
        app.exec_sys.host === host || app.exec_sys.host.endsWith(`.${host}`)
    );
    const { defaultHost, configuration } = state.systems.storage;
    const hasCorral =
      configuration.length &&
      ['cloud.corral.tacc.utexas.edu', 'data.tacc.utexas.edu'].some((s) =>
        defaultHost.endsWith(s)
      );
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
      defaultStorageHost: defaultHost,
      hasStorageSystems: configuration.length,
      downSystems: state.systemMonitor
        ? state.systemMonitor.list
            .filter((currSystem) => !currSystem.is_operational)
            .map((downSys) => downSys.hostname)
        : [],
      execSystem: state.app ? state.app.exec_sys.host : '',
    };
  }, shallowEqual);

  const hideManageAccount = useSelector(
    (state) => state.workbench.config.hideManageAccount
  );

  const { systemNeedsKeys, pushKeysSystem } = app;

  const missingLicense = app.license.type && !app.license.enabled;
  const pushKeys = (e) => {
    e.preventDefault();
    dispatch({
      type: 'SYSTEMS_TOGGLE_MODAL',
      payload: {
        operation: 'pushKeys',
        props: {
          system: pushKeysSystem,
        },
      },
    });
  };

  const appFields = FormSchema(app);

  // initial form values
  const initialValues = {
    ...appFields.defaults,
    name: `${app.definition.id}_${new Date().toISOString().split('.')[0]}`,
    execSystemLogicalQueue: (
      (app.definition.jobAttributes.execSystemLogicalQueue
        ? app.exec_sys.batchLogicalQueues.find(
            (q) =>
              q.name === app.definition.jobAttributes.execSystemLogicalQueue
          )
        : app.exec_sys.batchLogicalQueues.find(
            (q) => q.name === app.exec_sys.batchDefaultLogicalQueue
          )) || app.exec_sys.batchLogicalQueues[0]
    ).name,
    nodeCount: app.definition.jobAttributes.nodeCount,
    coresPerNode: app.definition.jobAttributes.coresPerNode,
    maxMinutes: app.definition.jobAttributes.maxMinutes,
    archiveSystemDir: '',
    archiveOnAppError: true,
    appId: app.definition.id,
    execSystemId: app.definition.jobAttributes.execSystemId,
  };
  let missingAllocation = false;
  if (app.exec_sys.batchScheduler === 'SLURM') {
    if (allocations.includes(portalAlloc)) {
      initialValues.allocation = portalAlloc;
    } else {
      initialValues.allocation = allocations.length === 1 ? allocations[0] : '';
    }
    if (!hasDefaultAllocation && hasStorageSystems) {
      jobSubmission.error = true;
      jobSubmission.response = {
        message: `You need an allocation on ${getSystemName(
          defaultStorageHost
        )} to run this application.`,
      };
      missingAllocation = true;
    } else if (!allocations.length) {
      jobSubmission.error = true;
      jobSubmission.response = {
        message: `You need an allocation on ${getSystemName(
          app.exec_sys.host
        )} to run this application.`,
      };
      missingAllocation = true;
    }
  } else {
    initialValues.allocation = app.exec_sys.batchScheduler;
  }
  return (
    <div id="appForm-wrapper">
      {/* The !! is needed because the second value of this shorthand
          is interpreted as a literal 0 if not. */}
      {!!(systemNeedsKeys && hasStorageSystems) && (
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
      {!hasStorageSystems && (
        <div className="appDetail-error">
          <SectionMessage type="warning">
            No storage systems enabled for this portal.
          </SectionMessage>
        </div>
      )}
      {!!(missingLicense && hasStorageSystems && !hideManageAccount) && (
        <div className="appDetail-error">
          <SectionMessage type="warning">
            Activate your {app.license.type} license in{' '}
            <Link
              to={`${ROUTES.WORKBENCH}${ROUTES.ACCOUNT}`}
              className="wb-link"
            >
              Manage Account
            </Link>
            , then return to this form.
          </SectionMessage>
        </div>
      )}
      {downSystems.includes(execSystem) && (
        <div className="appDetail-error">
          <SectionMessage type="warning">
            System down for maintenance. Check System Status in the&nbsp;
            <Link to="/workbench/dashboard" className="wb-link">
              Dashboard
            </Link>
            &nbsp;for updates.
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
        validateOnMount
        initialValues={initialValues}
        initialTouched={initialValues}
        validationSchema={(props) => {
          if (jobSubmission.submitting) {
            /* to to avoid a strange error where values are valid but yup returns invalid,
            we stop invalidating during submission. This occurs only when validateOnMount is set.
             */
            return Yup.mixed().notRequired();
          }
          return Yup.lazy((values) => {
            const queue = app.exec_sys.batchLogicalQueues.find(
              (q) => q.name === values.execSystemLogicalQueue
            );
            const schema = Yup.object({
              appArgs: Yup.object({ ...appFields.schema.appArgs }),
              fileInputs: Yup.object({ ...appFields.schema.fileInputs }),
              // TODOv3 handle fileInputArrays https://jira.tacc.utexas.edu/browse/TV3-8
              name: Yup.string()
                .max(64, 'Must be 64 characters or less')
                .required('Required'),
              execSystemLogicalQueue: getQueueValidation(queue, app),
              nodeCount: getNodeCountValidation(queue, app),
              coresPerNode: getCoresPerNodeValidation(queue),
              maxMinutes: getMaxMinutesValidation(queue).required('Required'),
              archiveSystemDir: Yup.string(),
              allocation: Yup.string()
                .required('Required')
                .oneOf(
                  allocations.concat([app.exec_sys.batchScheduler]),
                  'Please select an allocation from the dropdown.'
                ),
            });
            return schema;
          });
        }}
        onSubmit={(values, { setSubmitting, resetForm }) => {
          const job = cloneDeep(values);

          job.appVersion = app.definition.version;
          job.fileInputs = Object.entries(job.fileInputs)
            .map(([k, v]) => {
              return { name: k, sourceUrl: v };
            })
            .filter((fileInput) => fileInput.sourceUrl); // filter out any empty values
          job.parameterSet = {};
          job.parameterSet.appArgs = Object.entries(job.appArgs)
            .map(([k, v]) => {
              return { name: k, arg: v };
            })
            .filter(
              (appArg) =>
                !(
                  appArg.arg === '' ||
                  appArg.arg === null ||
                  appArg.arg === undefined
                )
            ); // filter out any empty values
          delete job.appArgs;
          // TODOv3 add envVariables
          /* remove falsy parameter */ // TODOv3 consider if we need to remove falsy parmeter AND false file inputs
          // TODO: allow falsy parameters for parameters of type bool
          /* To ensure that DCV and VNC server is alive, name of job needs to contain 'dcvserver' or 'tap_" respectively */
          if (app.definition.tags.includes('DCV')) {
            job.name += '-dcvserver';
          }
          if (app.definition.tags.includes('VNC')) {
            job.name += 'tap_';
          }
          if (app.license.type && app.license.enabled) {
            job.licenseType = app.license.type;
          }
          if (job.allocation) {
            if (!job.parameterSet.schedulerOptions) {
              job.parameterSet.schedulerOptions = [];
            }
            job.parameterSet.schedulerOptions.push({
              name: 'Allocation',
              description: 'The allocation associated with this job execution',
              include: true,
              arg: `-A ${job.allocation}`,
            });
            delete job.allocation;
          }
          dispatch({
            type: 'SUBMIT_JOB',
            payload: job,
          });
        }}
      >
        {({
          values,
          errors,
          isValid,
          isSubmitting,
          handleReset,
          resetForm,
          setSubmitting,
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
            missingLicense ||
            !hasStorageSystems ||
            jobSubmission.submitting ||
            (app.exec_sys.batchScheduler === 'SLURM' && missingAllocation);
          return (
            <Form>
              <AdjustValuesWhenQueueChanges app={app} />
              <FormGroup tag="fieldset" disabled={readOnly || systemNeedsKeys}>
                {Object.keys(appFields.fileInputs).length > 0 && (
                  <div className="appSchema-section">
                    <div className="appSchema-header">
                      <span>Inputs</span>
                    </div>
                    {Object.entries(appFields.fileInputs).map(
                      ([name, field]) => {
                        // TODOv3 handle fileInputArrays https://jira.tacc.utexas.edu/browse/TV3-8
                        return (
                          <FormField
                            {...field}
                            name={`fileInputs.${name}`}
                            agaveFile
                            SelectModal={DataFilesSelectModal}
                            placeholder="Browse Data Files"
                            key={`fileInputs.${name}`}
                          />
                        );
                      }
                    )}
                    {Object.entries(appFields.appArgs).map(([name, field]) => {
                      return (
                        <FormField
                          {...field}
                          name={`appArgs.${name}`}
                          key={`appArgs.${name}`}
                        >
                          {field.options
                            ? field.options.map((item) => {
                                let val = item;
                                if (val instanceof String) {
                                  const tmp = {};
                                  tmp[val] = val;
                                  val = tmp;
                                }
                                return Object.entries(val).map(
                                  ([key, value]) => (
                                    <option key={key} value={key}>
                                      {value}
                                    </option>
                                  )
                                );
                              })
                            : null}
                        </FormField>
                      );
                    })}
                    {/* TODOv3 handle parameterSet.envVariables */}
                  </div>
                )}
                <div className="appSchema-section">
                  <div className="appSchema-header">
                    <span>Configuration</span>
                  </div>
                  <FormField
                    label="Queue"
                    name="execSystemLogicalQueue"
                    description="Select the queue this job will execute on."
                    type="select"
                    required
                  >
                    {app.exec_sys.batchLogicalQueues
                      .map((q) => q.name)
                      .filter(
                        (q) =>
                          // normal queue on Frontera does not support 1 (or 2) node jobs and should not be listed if app is fixed to single node
                          !(
                            getSystemName(app.exec_sys.host) === 'Frontera' &&
                            q === 'normal' &&
                            app.definition.notes.hideNodeCountAndCoresPerNode
                          )
                      )
                      .sort()
                      .map((queueName) => (
                        <option key={queueName} value={queueName}>
                          {queueName}
                        </option>
                      ))
                      .sort()}
                  </FormField>
                  {!app.definition.notes.isInteractive ? (
                    <FormField
                      label="Maximum Job Runtime"
                      description={`The maximum number of minutes you expect this job to run for. Maximum possible is ${getQueueMaxMinutes(
                        app,
                        values.execSystemLogicalQueue
                      )} minutes. After this amount of time your job will end. Shorter run times result in shorter queue wait times.`}
                      name="maxMinutes"
                      type="integer"
                      required
                    />
                  ) : null}
                  {!app.definition.notes.hideNodeCountAndCoresPerNode ? (
                    <>
                      <FormField
                        label="Cores Per Node"
                        description="Number of processors (cores) per node for the job. e.g. a selection of 16 processors per node along with 4 nodes will result in 16 processors on 4 nodes, with 64 processors total."
                        name="coresPerNode"
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
                  {app.exec_sys.batchScheduler === 'SLURM' ? (
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
                      {allocations.sort().map((projectId) => (
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
                  {!app.definition.notes.isInteractive ? (
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
                <Button
                  attr="submit"
                  size="medium"
                  type="primary"
                  disabled={!isValid}
                  isLoading={jobSubmission.submitting}
                  iconNameBefore={jobSubmission.error ? 'alert' : null}
                >
                  Submit
                </Button>
                <Button
                  onClick={handleReset}
                  className="btn-resetForm"
                  type="link"
                >
                  Reset Fields to Defaults
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
  app: appShape.isRequired,
};
