const jobDisplaySlurmFixture = {
  allocation: 'TACC-ACI',
  applicationName: 'Hello World',
  inputs: [
    {
      id: 'tapis://test.community/system/1/user/test/in.txt',
      label: 'File to modify',
      value: 'tapis://test.community/system/1/user/test/in.txt',
    },
  ],
  parameters: [
    {
      label: 'Greeting',
      id: 'Greeting',
      value: 'hello',
    },
    {
      label: 'Target',
      id: 'Target',
      value: 'world',
    },
  ],
  nodeCount: 1,
  coresPerNode: 1,
  queue: 'development',
  systemName: 'Frontera',
  workPath: '/system/1/user/tapis/1/jobs/1/output',
};

export default jobDisplaySlurmFixture;
