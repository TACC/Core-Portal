const jobDetailDisplayFixture = {
  applicationName: 'Compress folder',
  systemName: 'username.FORK.exec.stampede2.CLI',
  inputs: [
    {
      label: 'Target Path to be Compressed',
      id: 'workingDirectory',
      value: 'agave://cep.home.username/COE332'
    }
  ],
  parameters: [
    {
      label: 'Compression Type',
      id: 'compression_type',
      value: 'tgz'
    }
  ]
};

export default jobDetailDisplayFixture;
