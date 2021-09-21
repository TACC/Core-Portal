// Admin list of a single user (i.e. result of `api/onboarding/user/username`)
export const onboardingUserFixture = {
  username: 'username',
  firstName: 'First',
  lastName: 'Last',
  setupComplete: false,
  steps: [
    {
      data: null,
      step: 'portal.apps.onboarding.steps.test_steps.MockUserWaitStep',
      displayName: 'Mock User Wait Step',
      description:
        'Long description of a mock step that waits for a user to take action',
      userConfirm: 'Request Portal Access',
      staffApprove: 'Approve',
      staffDeny: 'Deny',
      state: 'userwait',
      events: [
        {
          username: 'username',
          state: 'failed',
          step: 'portal.apps.onboarding.steps.test_steps.MockUserWaitStep',
          time: '2020-09-23 16:43:01.103968+00:00',
          message: 'Failure',
          data: null
        },
        {
          username: 'username',
          state: 'processing',
          step: 'portal.apps.onboarding.steps.test_steps.MockUserWaitStep',
          time: '2020-09-23 16:42:51.110869+00:00',
          message: 'Beginning automated processing',
          data: null
        },
        {
          username: 'username',
          state: 'pending',
          step: 'portal.apps.onboarding.steps.test_steps.MockUserWaitStep',
          time: '2020-09-23 16:42:37.884030+00:00',
          message: 'Pending',
          data: null
        }
      ]
    },
    {
      data: null,
      step: 'portal.apps.onboarding.steps.test_steps.MockStaffWaitStep',
      displayName: 'Mock Staff Wait Step',
      description:
        'Long description of a mock step that waits for a staff user to take action',
      userConfirm: 'Request Portal Access',
      staffApprove: 'Approve',
      staffDeny: 'Deny',
      state: 'staffwait',
      events: [
        {
          username: 'username',
          state: 'failed',
          step: 'portal.apps.onboarding.steps.test_steps.MockStaffWaitStep',
          time: '2020-09-23 16:43:01.103968+00:00',
          message: 'Failure',
          data: null
        },
        {
          username: 'username',
          state: 'processing',
          step: 'portal.apps.onboarding.steps.test_steps.MockStaffWaitStep',
          time: '2020-09-23 16:42:51.110869+00:00',
          message: 'Beginning automated processing',
          data: null
        },
        {
          username: 'username',
          state: 'pending',
          step: 'portal.apps.onboarding.steps.test_steps.MockStaffWaitStep',
          time: '2020-09-23 16:42:37.884030+00:00',
          message: 'Pending',
          data: null
        }
      ]
    },
    {
      data: null,
      step:
        'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep',
      displayName: 'Mock Processing Complete Step',
      description:
        'Long description of a mock step that automatically processes then completes',
      userConfirm: 'Confirm',
      staffApprove: 'Approve',
      staffDeny: 'Deny',
      state: 'completed',
      customStatus: 'Confirmed',
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
      description:
        'Long description of a mock step that automatically processes then fails',
      userConfirm: 'Confirm',
      staffApprove: 'Approve',
      staffDeny: 'Deny',
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

// Admin listing of all users (i.e. result of `api/onboarding/admin/`)
export const onboardingAdminFixture = {
  users: [{ ...onboardingUserFixture }],
  offset: 0,
  limit: 25,
  total: 1
};

export const onboardingActionFixture = {
  step: null,
  action: null,
  username: null,
  loading: false,
  error: null
};

export const onboardingAdminState = {
  admin: {
    users: onboardingAdminFixture.users,
    offset: 0,
    limit: 25,
    total: 1,
    query: 'query',
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
  },
  action: onboardingActionFixture
};

export const onboardingUserState = {
  admin: {
    users: [],
    offset: 0,
    limit: 25,
    total: 0,
    query: null,
    loading: false,
    error: null
  },
  user: {
    ...onboardingUserFixture,
    loading: false,
    error: null
  },
  action: onboardingActionFixture
};

export const onboardingActionState = {
  admin: {
    users: [],
    offset: 0,
    limit: 25,
    total: 0,
    query: null,
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
  },
  action: {
    step: 'onboarding.step',
    action: 'user_confirm',
    username: 'username',
    loading: false,
    error: null
  }
};
