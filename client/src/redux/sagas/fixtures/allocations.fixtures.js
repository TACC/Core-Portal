export const projectNameFixture = 'TEST_PROJECT';
export const projectIdFixture = 1234;
export const teamFixture = [
  {
    id: 1,
    username: 'doc',
    role: 'PI',
    firstName: 'doc',
    lastName: 'brown',
    email: 'docbrown@gmail.com'
  },
  {
    id: 2,
    username: 'chicken',
    role: 'Standard',
    firstName: 'marty',
    lastName: 'mcfly',
    email: 'mcfly@gmail.com'
  },
  {
    id: 3,
    username: 'dude',
    role: 'Standard',
    firstName: 'Jeff',
    lastName: 'Lebowski',
    email: 'dude@gmail.com'
  }
];

export const allocationsFixture = [
  {
    title: 'Test Project',
    projectId: projectIdFixture,
    pi: 'Doc Brown',
    projectName: projectNameFixture,
    systems: [
      {
        name: 'Frontera',
        host: 'frontera.tacc.utexas.edu',
        type: 'HPC',
        allocation: {
          id: 1984,
          status: 'Active',
          computeRequested: 1,
          computeAllocated: 100,
          resourceId: 56,
          resource: 'Frontera',
          projectId: projectIdFixture,
          project: projectNameFixture,
          requestorId: 1,
          requestor: 'Maytal Dahan',
          computeUsed: 136.746
        }
      },
      {
        name: 'Longhorn',
        host: 'longhorn.tacc.utexas.edu',
        type: 'HPC',
        allocation: {
          id: 1985,
          status: 'Active',
          computeRequested: 100,
          computeAllocated: 100,
          resourceId: 58,
          resource: 'Longhorn3',
          projectId: projectIdFixture,
          project: projectNameFixture,
          requestorId: 1,
          requestor: 'Maytal Dahan',
          computeUsed: 0
        }
      }
    ]
  }
];

export const usageDataFixture = [
  {
    username: 'doc',
    usage: 5,
    resource: 'frontera.tacc.utexas.edu',
    allocationId: 1984
  },
  {
    username: 'chicken',
    usage: 55,
    resource: 'frontera.tacc.utexas.edu',
    allocationId: 1984
  },
  {
    username: 'doc',
    usage: 20,
    resource: 'longhorn.tacc.utexas.edu',
    allocationId: 1985
  },
  {
    username: 'chicken',
    usage: 25,
    resource: 'longhorn.tacc.utexas.edu',
    allocationId: 1985
  }
];
