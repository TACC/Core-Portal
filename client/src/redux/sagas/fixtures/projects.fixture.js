export const projectsListingFixture = [
  {
    id: 'test.site.project.PROJECT-3',
    name: 'PROJECT-3',
    host: 'cloud.data.tacc.utexas.edu',
    updated: '2023-03-07T19:31:17.292220Z',
    owner: {
      username: 'username',
      first_name: 'User',
      last_name: 'Name',
      email: 'user@username.com',
    },
    title: 'Test Project Title',
    description: 'Test Project Description',
  },
];

export const projectMetadataResponse = {
  title: 'My Project',
  projectId: 'TEST-1',
  description: 'Long description of shared workspace',
  created: '2020-12-08T16:34:54.354843+00:00',
  lastModified: '2020-12-08T16:34:54.828181+00:00',
  members: [
    {
      user: {
        username: 'username',
        first_name: 'User',
        last_name: 'Name',
        email: 'user@username.com',
      },
      access: 'owner',
    },
    {
      user: {
        last_name: 'Pi',
        first_name: 'Co',
        email: 'user@username.com',
        username: 'copi',
      },
      access: 'edit',
    },
    {
      user: {
        last_name: 'Member',
        first_name: 'Team',
        email: 'user@username.com',
        username: 'teammember',
      },
      access: 'edit',
    },
  ],
};

export const projectMetadataFixture = {
  ...projectMetadataResponse,
  loading: false,
  error: null,
};

export const projectsFixture = {
  listing: {
    projects: projectsListingFixture,
    loading: false,
    error: null,
  },
  metadata: {
    title: '',
    description: '',
    projectId: '',
    keywords: '',
    members: [],
    loading: false,
    error: null,
  },
};
