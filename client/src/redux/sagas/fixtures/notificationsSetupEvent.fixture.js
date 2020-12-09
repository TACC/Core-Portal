// a single step is processing
export const setupEventProcesssingFixture = {
  event_type: 'setup_event',
  setup_event: {
    username: 'username',
    state: 'processing',
    step: 'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep',
    time: '2020-09-21 12:39:14.163035+00:00',
    message: 'Beginning automated processing',
    data: null
  }
};

// a single step is completed
export const setupEventCompleteFixture = {
  event_type: 'setup_event',
  setup_event: {
    username: 'username',
    state: 'completed',
    step: 'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep',
    time: '2020-09-21 12:39:24.200777+00:00',
    message: 'Completed',
    data: null
  }
};

// another single step is processing
export const setupEventProcessingFixture2 = {
  event_type: 'setup_event',
  setup_event: {
    username: 'username',
    state: 'processing',
    step: 'portal.apps.onboarding.steps.test_steps.MockProcessingFailStep',
    time: '2020-09-21 12:39:24.226157+00:00',
    message: 'Beginning automated processing',
    data: null
  }
};

// single step fails
export const setupEventFailedFixture = {
  event_type: 'setup_event',
  setup_event: {
    username: 'username',
    state: 'failed',
    step: 'portal.apps.onboarding.steps.test_steps.MockProcessingFailStep',
    time: '2020-09-21 12:39:34.258842+00:00',
    message: 'Failure',
    data: null
  }
};

// event for when all setup steps have been completed and a user's setup_complete state changes to True
export const setupEventSetupCompleteFixture = {
  event_type: 'setup_event',
  setup_event: {
    username: 'username',
    state: 'completed',
    step: 'portal.apps.onboarding.execute.execute_setup_steps',
    time: '2020-09-19 11:37:00.117788+00:00',
    message: 'username setup is now complete',
    data: { setup_complete: true }
  }
};
