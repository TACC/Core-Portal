import {
  getAllocatonFromDirective,
  getReservationFromArg,
  getJobDisplayInformation,
  getOutputPath,
  getExecutionPath,
  isTerminalState,
  isOutputState,
  getParentPath,
  getArchivePath,
  getInputDisplayValues,
} from './jobsUtil';
import jobDetailFixture from '../redux/sagas/fixtures/jobdetail.fixture';
import jobDetailSlurmFixture from '../redux/sagas/fixtures/jobdetailSlurm.fixture';
import appDetailFixture from '../redux/sagas/fixtures/appdetail.fixture';
import appDetailSlurmFixture from '../redux/sagas/fixtures/appdetailSlurm.fixture';
import jobDetailDisplayFixture from '../redux/sagas/fixtures/jobdetaildisplay.fixture';
import jobDisplaySlurmFixture from '../redux/sagas/fixtures/jobdetaildisplaySlurm.fixture';

describe('jobsUtil', () => {
  it('get allocation from execution system queue directive', () => {
    expect(getAllocatonFromDirective('-A TACC-ACI')).toEqual('TACC-ACI');
    expect(getAllocatonFromDirective('-A TACC-ACI -Foo Bar')).toEqual(
      'TACC-ACI'
    );
    expect(getAllocatonFromDirective('-Ab Test')).toEqual(null);
    expect(getAllocatonFromDirective('')).toEqual(null);
  });

  it('gets reservation from schedulerOption arg', () => {
    expect(getReservationFromArg('--reservation=my_reservation')).toEqual(
      'my_reservation'
    );
    expect(getReservationFromArg('--reservation=')).toEqual('');
    expect(getReservationFromArg('--foo=bar')).toEqual(null);
    expect(getReservationFromArg(null)).toEqual(null);
  });

  it('get job display information', () => {
    expect(
      getJobDisplayInformation(jobDetailSlurmFixture, appDetailSlurmFixture)
    ).toEqual(jobDisplaySlurmFixture);
    expect(
      getJobDisplayInformation(jobDetailFixture, appDetailFixture)
    ).toEqual(jobDetailDisplayFixture);
  });

  it('get input display values for single file', () => {
    expect(
      getInputDisplayValues([
        { name: 'Target path', sourceUrl: 'tapis://sys/file1.zip' },
      ])
    ).toEqual([
      {
        label: 'Target path',
        id: 'tapis://sys/file1.zip',
        value: 'tapis://sys/file1.zip',
      },
    ]);
  });

  it('get input display values for multiple files', () => {
    expect(
      getInputDisplayValues([
        { name: 'Target path_1.1', sourceUrl: 'tapis://sys/file1.zip' },
        { name: '_1.2', sourceUrl: 'tapis://sys/file2.zip' },
        { name: '_1.3', sourceUrl: 'tapis://sys/file3.zip' },
      ])
    ).toEqual([
      {
        label: 'Target path (1/3)',
        id: 'tapis://sys/file1.zip',
        value: 'tapis://sys/file1.zip',
      },
      {
        label: 'Target path (2/3)',
        id: 'tapis://sys/file2.zip',
        value: 'tapis://sys/file2.zip',
      },
      {
        label: 'Target path (3/3)',
        id: 'tapis://sys/file3.zip',
        value: 'tapis://sys/file3.zip',
      },
    ]);
  });

  it('get input display values for distinct input fields', () => {
    expect(
      getInputDisplayValues([
        { name: 'Input Mesh_1.1', sourceUrl: 'tapis://sys/mesh.obj' },
        { name: 'Config File_2.1', sourceUrl: 'tapis://sys/config.yaml' },
      ])
    ).toEqual([
      {
        label: 'Input Mesh',
        id: 'tapis://sys/mesh.obj',
        value: 'tapis://sys/mesh.obj',
      },
      {
        label: 'Config File',
        id: 'tapis://sys/config.yaml',
        value: 'tapis://sys/config.yaml',
      },
    ]);
  });

  it('get input display values for mixed distinct and multi-file inputs', () => {
    expect(
      getInputDisplayValues([
        { name: 'Target path_1.1', sourceUrl: 'tapis://sys/file1.zip' },
        { name: '_1.2', sourceUrl: 'tapis://sys/file2.zip' },
        { name: 'Config File_2.1', sourceUrl: 'tapis://sys/config.yaml' },
      ])
    ).toEqual([
      {
        label: 'Target path (1/2)',
        id: 'tapis://sys/file1.zip',
        value: 'tapis://sys/file1.zip',
      },
      {
        label: 'Target path (2/2)',
        id: 'tapis://sys/file2.zip',
        value: 'tapis://sys/file2.zip',
      },
      {
        label: 'Config File',
        id: 'tapis://sys/config.yaml',
        value: 'tapis://sys/config.yaml',
      },
    ]);
  });

  it('get output path from job', () => {
    expect(getOutputPath(jobDetailFixture)).toEqual(
      'cloud.data/home/user/tapis-jobs-archive/2023-01-24Z/hello-world_2023-01-24T23:52:57-e929ad16-adc5-4bd4-b84f-d41d1b67e5ee-007'
    );
  });

  it('get execution path from job', () => {
    expect(getExecutionPath(jobDetailFixture)).toEqual(
      'frontera/scratch1/12345/user/tapis/e929ad16-adc5-4bd4-b84f-d41d1b67e5ee-007'
    );
  });

  it('determine if terminal state', () => {
    expect(isTerminalState('FAILED')).toEqual(true);
    expect(isTerminalState('FINISHED')).toEqual(true);
    expect(isTerminalState('CANCELLED')).toEqual(true);
    expect(isTerminalState('RUNNING')).toEqual(false);
  });

  it('determine if job state could have output', () => {
    expect(isOutputState('FAILED')).toEqual(true);
    expect(isOutputState('FINISHED')).toEqual(true);
    expect(isOutputState('STOPPED')).toEqual(false);
    expect(isOutputState('RUNNING')).toEqual(false);
  });

  it('returns directory path when file is in a folder', () => {
    const file = {
      name: 'test.txt',
      path: 'outerTestFolder/innerTestFolder/test.txt',
    };
    expect(getParentPath(file)).toEqual('outerTestFolder/innerTestFolder/');
  });

  it("returns '.' when file is at root of system", () => {
    const file = { name: 'test.txt', path: 'test.txt' };
    expect(getParentPath(file)).toEqual('.');
  });
});

describe('getArchivePath', () => {
  it('handles various archiveSystemDir formats correctly', () => {
    expect(
      getArchivePath({
        archiveSystemId: 'sys1',
        archiveSystemDir: '/path/to/dir',
      })
    ).toEqual('sys1/path/to/dir');

    expect(
      getArchivePath({
        archiveSystemId: 'sys2',
        archiveSystemDir: 'relative/path',
      })
    ).toEqual('sys2/relative/path');

    expect(
      getArchivePath({ archiveSystemId: 'sys3', archiveSystemDir: '/.' })
    ).toEqual('sys3');

    expect(
      getArchivePath({ archiveSystemId: 'sys4', archiveSystemDir: '' })
    ).toEqual('sys4/');
  });
});
