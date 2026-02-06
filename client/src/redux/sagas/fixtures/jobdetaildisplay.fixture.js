const jobDetailDisplayFixture = {
  allocation: 'TACC-ACI',
  applicationName: 'Hello World (Sleep 3m)',
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
    {
      id: 'Sleep Time',
      label: 'Sleep Time',
      value: '1',
    },
    {
      label: '_mainProgram',
      id: '_mainProgram',
      value: 'OpenSeesSP',
    },
  ],
  queue: 'development',
  systemName: 'Frontera',
  workPath:
    '/scratch1/12345/user/tapis/e929ad16-adc5-4bd4-b84f-d41d1b67e5ee-007',
  reservation: 'foobar',
};

export default jobDetailDisplayFixture;
