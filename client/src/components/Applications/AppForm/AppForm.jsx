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
  isTargetPathEmpty,
  isTargetPathField,
  getInputFieldFromTargetPathField,
  getQueueMaxMinutes,
  getMaxMinutesValidation,
  getNodeCountValidation,
  getCoresPerNodeValidation,
  updateValuesForQueue,
  getQueueValueForExecSystem,
  getAppQueueValues,
  matchExecSysWithAllocations,
} from './AppFormUtils';
import { getExecSystemFromId, getDefaultExecSystem } from 'utils/apps';

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
  execSystems: PropTypes.arrayOf(
    PropTypes.shape({
      host: PropTypes.string,
      scheduler: PropTypes.string,
      batchLogicalQueues: PropTypes.arrayOf(PropTypes.shape({})),
    })
  ),
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
 * HandleDependentFieldChanges is a component that makes uses of
 * useFormikContext to ensure that when users switch queues, some
 * variables are updated to match the queue specifications (i.e.
 * correct node count, runtime etc)
 */
const HandleDependentFieldChanges = ({ app, updateFormState }) => {
  const [previousValues, setPreviousValues] = useState();

  // Grab values and update if queue changes
  const { values, setValues } = useFormikContext();
  React.useEffect(() => {
    if (previousValues) {
      let valueUpdated = false;
      let updatedValues = { ...values };
      if (previousValues.execSystemId !== values.execSystemId) {
        const exec_sys = getExecSystemFromId(app, values.execSystemId);
        updatedValues.execSystemLogicalQueue = getQueueValueForExecSystem(
          app,
          exec_sys
        ).name;
        updatedValues = updateValuesForQueue(app, updatedValues);
        valueUpdated = true;

        updateFormState.setExecSys(exec_sys);
        updateFormState.setAppQueueValues(
          getAppQueueValues(app, exec_sys.batchLogicalQueues)
        );
        updateFormState.setAllocationsForExecSys(exec_sys);
      }

      if (
        previousValues.execSystemLogicalQueue !== values.execSystemLogicalQueue
      ) {
        updatedValues = updateValuesForQueue(app, values);
        valueUpdated = true;
      }
      if (valueUpdated) setValues(updatedValues);
    }
    setPreviousValues(values);
  }, [app, values, setValues, updateFormState]);
  return null;
};

const AppInfo = ({ app }) => {
  const categoryDict = useSelector((state) => state.apps.categoryDict);
  const getAppCategory = (appId) => {
    for (const [cat, apps] of Object.entries(categoryDict)) {
      if (apps.some((app) => app.appId === appId)) {
        return cat;
      }
    }
    return null;
  };

  const appCategory = getAppCategory(app.definition.id);

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
          <AppIcon appId={app.definition.id} category={appCategory} />{' '}
          <span>{app.definition.notes.label} Documentation</span>
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
    execSystemAllocationsMap,
    portalAlloc,
    jobSubmission,
    hasDefaultAllocation,
    defaultStorageHost,
    hasStorageSystems,
    downSystems,
    execSystem,
    defaultSystem,
    keyService,
    execSystemsWithAllocation,
  } = useSelector((state) => {
    const matchingExecutionHostsMap = matchExecSysWithAllocations(
      app,
      state.allocations
    );
    const execSystemsWithAllocation = [...matchingExecutionHostsMap.keys()];
    const { defaultHost, configuration, defaultSystem } = state.systems.storage;

    const keyService = state.systems.storage.configuration.find(
      (sys) => sys.system === defaultSystem && sys.default
    )?.keyservice;

    const hasCorral =
      configuration.length &&
      ['corral.tacc.utexas.edu', 'data.tacc.utexas.edu'].some((s) =>
        defaultHost?.endsWith(s)
      );
    return {
      execSystemAllocationsMap: matchingExecutionHostsMap,
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
      execSystem: getDefaultExecSystem(app) ?? '',
      defaultSystem,
      keyService,
      execSystemsWithAllocation,
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
  const [currentValues, setCurrentValues] = useState({
    execSys: execSystem,
    allocations: execSystemAllocationsMap.get(execSystem.id) ?? [],
    appQueueValues: getAppQueueValues(app, execSystem.batchLogicalQueues),
  });

  const updateFormState = {
    setExecSys: (newValue) => {
      setCurrentValues((prevState) => ({ ...prevState, execSys: newValue }));
    },
    setAllocationsForExecSys: (execSys) => {
      setCurrentValues((prevState) => ({
        ...prevState,
        allocations: execSystemAllocationsMap.get(execSys?.id) ?? [],
      }));
    },
    setAppQueueValues: (newValue) => {
      setCurrentValues((prevState) => ({
        ...prevState,
        appQueueValues: newValue,
      }));
    },
  };

  // initial form values
  const initialValues = {
    ...appFields.defaults,
    name: `${app.definition.id}-${app.definition.version}_${
      new Date().toISOString().split('.')[0]
    }`,
    nodeCount: app.definition.jobAttributes.nodeCount,
    coresPerNode: app.definition.jobAttributes.coresPerNode,
    maxMinutes: app.definition.jobAttributes.maxMinutes,
    archiveSystemId:
      app.definition.jobAttributes.archiveSystemId || defaultSystem,
    archiveSystemDir: app.definition.jobAttributes.archiveSystemDir,
    archiveOnAppError: true,
    appId: app.definition.id,
    appVersion: app.definition.version,
    execSystemId: app.definition.jobAttributes.execSystemId,
  };

  let missingAllocation = false;
  if (app.definition.jobType === 'BATCH') {
    initialValues.execSystemLogicalQueue = getQueueValueForExecSystem(
      app,
      getExecSystemFromId(app, app.definition.jobAttributes.execSystemId)
    ).name;
    if (currentValues.allocations.includes(portalAlloc)) {
      initialValues.allocation = portalAlloc;
    } else {
      initialValues.allocation =
        currentValues.allocations.length === 1
          ? currentValues.allocations[0]
          : '';
    }
    if (!hasDefaultAllocation && hasStorageSystems) {
      jobSubmission.error = true;
      jobSubmission.response = {
        message: `You need an allocation on ${getSystemName(
          defaultStorageHost
        )} to run this application.`,
      };
      missingAllocation = true;
    } else if (!currentValues.allocations.length) {
      jobSubmission.error = true;
      jobSubmission.response = {
        message: `You need an allocation on ${getSystemName(
          currentValues.execSys.host
        )} to run this application.`,
      };
      missingAllocation = true;
    }
  }

  const sectionMessage = keyService ? (
    <span>
      For help,{' '}
      <Link
        className="wb-link"
        to={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/create`}
      >
        submit a ticket.
      </Link>
    </span>
  ) : (
    <span>
      If this is your first time logging in, you may need to&nbsp;
      <a
        className="data-files-nav-link"
        type="button"
        href="#"
        onClick={pushKeys}
      >
        push your keys
      </a>
      .
    </span>
  );

  return (
    <div id="appForm-wrapper">
      {/* The !! is needed because the second value of this shorthand
          is interpreted as a literal 0 if not. */}
      {!!(systemNeedsKeys && hasStorageSystems) && (
        <div className="appDetail-error">
          <SectionMessage type="warning">
            There was a problem accessing your default My Data file system.{' '}
            {sectionMessage}
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
            const exec_sys = getExecSystemFromId(app, values.execSystemId);
            const queue = getQueueValueForExecSystem(
              app,
              exec_sys,
              values.execSystemLogicalQueue
            );
            const schema = Yup.object({
              parameterSet: Yup.object({
                ...Object.assign(
                  {},
                  ...Object.entries(appFields.schema.parameterSet).map(
                    ([k, v]) => ({
                      [k]: Yup.object({ ...v }),
                    })
                  )
                ),
              }),
              fileInputs: Yup.object({ ...appFields.schema.fileInputs }),
              // TODOv3 handle fileInputArrays https://jira.tacc.utexas.edu/browse/WP-81
              name: Yup.string()
                .max(64, 'Must be 64 characters or less')
                .required('Required'),
              execSystemLogicalQueue: Yup.string()
                .required('Required')
                .oneOf(exec_sys.batchLogicalQueues.map((q) => q.name)),
              nodeCount: getNodeCountValidation(queue, app),
              coresPerNode: getCoresPerNodeValidation(queue),
              maxMinutes: getMaxMinutesValidation(queue).required('Required'),
              archiveSystemId: Yup.string(),
              archiveSystemDir: Yup.string(),
              allocation: Yup.string()
                .required('Required')
                .oneOf(
                  currentValues.allocations,
                  'Please select an allocation from the dropdown.'
                ),
            });
            return schema;
          });
        }}
        onSubmit={(values, { setSubmitting, resetForm }) => {
          const job = cloneDeep(values);

          // Transform input field values into format that jobs service wants.
          // File Input structure will have 2 fields if target path is required by the app.
          // field 1 - has source url
          // field 2 - has target path for the source url.
          // tapis wants only 1 field with 2 properties - source url and target path.
          // The logic below handles that scenario by merging the related fields into 1 field.
          job.fileInputs = Object.values(
            Object.entries(job.fileInputs)
              .map(([k, v]) => {
                // filter out read only inputs. 'FIXED' inputs are tracked as readOnly
                if (
                  Object.hasOwn(appFields.fileInputs, k) &&
                  appFields.fileInputs[k].readOnly
                )
                  return;
                return {
                  name: k,
                  sourceUrl: !isTargetPathField(k) ? v : null,
                  targetDir: isTargetPathField(k) ? v : null,
                };
              })
              .filter((v) => v) //filter nulls
              .reduce((acc, entry) => {
                // merge input field and targetPath fields into one.
                const key = getInputFieldFromTargetPathField(entry.name);
                if (!acc[key]) {
                  acc[key] = {};
                }
                acc[key]['name'] = key;
                acc[key]['sourceUrl'] =
                  acc[key]['sourceUrl'] ?? entry.sourceUrl;
                acc[key]['targetPath'] =
                  acc[key]['targetPath'] ?? entry.targetDir;
                return acc;
              }, {})
          )
            .flat()
            .filter((fileInput) => fileInput.sourceUrl) // filter out any empty values
            .map((fileInput) => {
              if (isTargetPathEmpty(fileInput.targetPath)) {
                return {
                  name: fileInput.name,
                  sourceUrl: fileInput.sourceUrl,
                };
              }
              return fileInput;
            });

          job.parameterSet = Object.assign(
            {},
            ...Object.entries(job.parameterSet).map(
              ([parameterSet, parameterValue]) => {
                return {
                  [parameterSet]: Object.entries(parameterValue)
                    .map(([k, v]) => {
                      if (!v) return;
                      // filter read only parameters. 'FIXED' parameters are tracked as readOnly
                      if (
                        Object.hasOwn(
                          appFields.parameterSet[parameterSet],
                          k
                        ) &&
                        appFields.parameterSet[parameterSet][k].readOnly
                      )
                        return;
                      return parameterSet === 'envVariables'
                        ? { key: k, value: v }
                        : { name: k, arg: v };
                    })
                    .filter((v) => v), // filter out any empty values
                };
              }
            )
          );

          // Add allocation scheduler option
          if (job.allocation) {
            if (!job.parameterSet.schedulerOptions) {
              job.parameterSet.schedulerOptions = [];
            }
            job.parameterSet.schedulerOptions.push({
              name: 'TACC Allocation',
              description:
                'The TACC allocation associated with this job execution',
              include: true,
              arg: `-A ${job.allocation}`,
            });
            delete job.allocation;
          }

          dispatch({
            type: 'SUBMIT_JOB',
            payload: {
              job,
              licenseType: app.license.type,
              isInteractive: !!app.definition.notes.isInteractive,
            },
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
            (app.definition.jobType === 'BATCH' && missingAllocation);
          return (
            <Form>
              <HandleDependentFieldChanges
                app={app}
                updateFormState={updateFormState}
              />
              <FormGroup tag="fieldset" disabled={readOnly || systemNeedsKeys}>
                {Object.keys(appFields.fileInputs).length > 0 && (
                  <div className="appSchema-section">
                    <div className="appSchema-header">
                      <span>Inputs</span>
                    </div>
                    {Object.entries(appFields.fileInputs).map(
                      ([name, field]) => {
                        // TODOv3 handle fileInputArrays https://jira.tacc.utexas.edu/browse/WP-81
                        return isTargetPathField(name) ? (
                          <FormField
                            {...field}
                            name={`fileInputs.${name}`}
                            placeholder="Target Path Name"
                            key={`fileInputs.${name}`}
                          />
                        ) : (
                          <FormField
                            {...field}
                            name={`fileInputs.${name}`}
                            tapisFile
                            SelectModal={DataFilesSelectModal}
                            placeholder="Browse Data Files"
                            key={`fileInputs.${name}`}
                          />
                        );
                      }
                    )}
                  </div>
                )}
                {Object.entries(appFields.parameterSet)
                  .map(
                    ([parameterSet, parameterValue]) =>
                      Object.keys(parameterValue).length
                  )
                  .reduce((a, b) => a + b) > 0 && (
                  <div className="appSchema-section">
                    <div className="appSchema-header">
                      <span>Parameters</span>
                    </div>
                    {Object.entries(appFields.parameterSet).map(
                      ([parameterSet, parameterValue]) => {
                        return Object.entries(parameterValue).map(
                          ([name, field]) => (
                            <FormField
                              {...field}
                              name={`parameterSet.${parameterSet}.${name}`}
                              key={`parameterSet.${parameterSet}.${name}`}
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
                          )
                        );
                      }
                    )}
                  </div>
                )}
                <div className="appSchema-section">
                  <div className="appSchema-header">
                    <span>Configuration</span>
                  </div>
                  {app.execSystems &&
                    Object.keys(execSystemsWithAllocation).length > 1 && (
                      <FormField
                        label="Execution System"
                        name="execSystemId"
                        description="Select the system this job will execute on."
                        type="select"
                        required
                      >
                        {execSystemsWithAllocation
                          .sort()
                          .map((exec_system_id) => (
                            <option key={exec_system_id} value={exec_system_id}>
                              {getSystemName(
                                getExecSystemFromId(app, exec_system_id)?.host
                              )}{' '}
                              : {exec_system_id} :{' '}
                              {getExecSystemFromId(app, exec_system_id)?.host}
                            </option>
                          ))}
                      </FormField>
                    )}
                  {app.definition.jobType === 'BATCH' && (
                    <FormField
                      label="Queue"
                      name="execSystemLogicalQueue"
                      description="Select the queue this job will execute on."
                      type="select"
                      required
                    >
                      {currentValues.appQueueValues.map((queueName) => (
                        <option key={queueName} value={queueName}>
                          {queueName}
                        </option>
                      ))}
                    </FormField>
                  )}
                  <FormField
                    label="Maximum Job Runtime (minutes)"
                    description={`The maximum number of minutes you expect this job to run for. Maximum possible is ${getQueueMaxMinutes(
                      getExecSystemFromId(app, values.execSystemId),
                      values.execSystemLogicalQueue
                    )} minutes. After this amount of time your job will end. Shorter run times result in shorter queue wait times.`}
                    name="maxMinutes"
                    type="number"
                    required
                  />
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
                  {app.definition.jobType === 'BATCH' && (
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
                      {currentValues.allocations.sort().map((projectId) => (
                        <option key={projectId} value={projectId}>
                          {projectId}
                        </option>
                      ))}
                    </FormField>
                  )}
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
                    <>
                      <FormField
                        label="Archive System"
                        description="System into which output files are archived after application execution."
                        name="archiveSystemId"
                        type="text"
                        placeholder={
                          app.definition.archiveSystemId || defaultSystem
                        }
                      />
                      <FormField
                        label="Archive Directory"
                        description="Directory into which output files are archived after application execution."
                        name="archiveSystemDir"
                        type="text"
                        placeholder={
                          app.definition.archiveSystemDir ||
                          'HOST_EVAL($HOME)/tapis-jobs-archive/${JobCreateDate}/${JobName}-${JobUUID}'
                        }
                      />
                    </>
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
