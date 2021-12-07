const jobDisplaySlurmFixture = {
  applicationName: 'QGIS',
  systemName: 'Stampede2',
  inputs: [
    {
      label: 'Working Directory',
      id: 'workingDirectory',
      value: 'agave://frontera.home.maxmunstermann/5MB.txt'
    }
  ],
  parameters: [
    {
      label: 'Desktop Resolution',
      id: 'desktop_resolution',
      value: '1280x800'
    }
  ],
  allocation: 'TACC-ACI',
  queue: 'normal',
  processorsPerNode: 20,
  nodeCount: 1
};

export default jobDisplaySlurmFixture;
