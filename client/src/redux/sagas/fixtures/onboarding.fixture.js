// Admin listing of all users (i.e. result of `api/onboarding/admin/`)
export const onboardingAdminFixture = {
  users: [
    {
      username: 'username',
      setupComplete: false,
      firstName: 'First',
      lastName: 'Last',
      dateJoined: '2020-09-23T16:42:37.623Z',
      lastEvent: {
        username: 'username',
        state: 'failed',
        step: 'portal.apps.onboarding.steps.test_steps.MockProcessingFailStep',
        time: '2020-09-23 16:43:01.103968+00:00',
        message: 'Failure',
        data: null
      },
      email: 'username@tacc.utexas.edu'
    }
  ]
};

// Admin list of a single user (i.e. result of `api/onboarding/user/username`)
export const onboardingUserFixture = {
  username: 'username',
  firstName: 'First',
  lastName: 'Last',
  setupComplete: false,
  steps: [
    {
      data: null,
      step:
        'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep',
      displayName: 'Mock Processing Complete Step',
      state: 'completed',
      events: [
        {
          username: 'username',
          state: 'completed',
          step:
            'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep',
          time: '2020-09-23 16:42:51.069506+00:00',
          message: 'Completed',
          data: null
        },
        {
          username: 'username',
          state: 'processing',
          step:
            'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep',
          time: '2020-09-23 16:42:41.029434+00:00',
          message: 'Beginning automated processing',
          data: null
        },
        {
          username: 'username',
          state: 'pending',
          step:
            'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep',
          time: '2020-09-23 16:42:37.848371+00:00',
          message: 'Pending',
          data: null
        }
      ]
    },
    {
      data: null,
      step: 'portal.apps.onboarding.steps.test_steps.MockProcessingFailStep',
      displayName: 'Mock Processing Fail Step',
      state: 'failed',
      events: [
        {
          username: 'username',
          state: 'failed',
          step:
            'portal.apps.onboarding.steps.test_steps.MockProcessingFailStep',
          time: '2020-09-23 16:43:01.103968+00:00',
          message: 'Failure',
          data: null
        },
        {
          username: 'username',
          state: 'processing',
          step:
            'portal.apps.onboarding.steps.test_steps.MockProcessingFailStep',
          time: '2020-09-23 16:42:51.110869+00:00',
          message: 'Beginning automated processing',
          data: null
        },
        {
          username: 'username',
          state: 'pending',
          step:
            'portal.apps.onboarding.steps.test_steps.MockProcessingFailStep',
          time: '2020-09-23 16:42:37.884030+00:00',
          message: 'Pending',
          data: null
        }
      ]
    }
  ],
  isStaff: true,
  email: 'username@tacc.utexas.edu'
};

export const onboardingAdminState = {
  admin: {
    users: onboardingAdminFixture.users,
    loading: false,
    error: null
  },
  user: {
    username: null,
    firstName: null,
    lastName: null,
    setupComplete: false,
    steps: [],
    loading: false,
    error: null
  }
};

export const onboardingUserState = {
  admin: {
    users: [],
    loading: false,
    error: null
  },
  user: {
    ...onboardingUserFixture,
    loading: false,
    error: null
  }
};
