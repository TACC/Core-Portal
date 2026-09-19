import execSystemsFixture from './executionsystems.fixture.js';

export const extractApp = {
  definition: {
    sharedAppCtx: true,
    isPublic: true,
    tenant: 'portals',
    id: 'extract-express',
    version: '0.0.1',
    description: 'Extract a tar, tar.gz, tgz, gz, or zip file.',
    owner: 'wma_prtl',
    enabled: true,
    runtime: 'SINGULARITY',
    runtimeVersion: '3.7.2',
    runtimeOptions: ['SINGULARITY_RUN'],
    containerImage: 'library://rstijerina/taccapps/extract:latest',
    jobType: 'BATCH',
    maxJobs: 2147483647,
    maxJobsPerUser: 2147483647,
    strictFileInputs: true,
    jobAttributes: {
      description: 'Extract a tar, tar.gz, tgz, gz, or zip file.',
      dynamicExecSystem: false,
      execSystemConstraints: null,
      execSystemId: 'frontera',
      execSystemExecDir: '${JobWorkingDir}',
      execSystemInputDir: '${JobWorkingDir}/input',
      execSystemOutputDir: '${JobWorkingDir}/output',
      execSystemLogicalQueue: 'development',
      archiveSystemId: 'cloud.data',
      archiveSystemDir:
        'HOST_EVAL($HOME)/tapis-jobs-archive/${JobCreateDate}/${JobName}-${JobUUID}',
      archiveOnAppError: false,
      isMpi: false,
      mpiCmd: null,
      cmdPrefix: null,
      parameterSet: {
        appArgs: [],
        containerArgs: [],
        schedulerOptions: [
          {
            arg: '--tapis-profile tacc',
            name: 'TACC Scheduler Profile',
            description: 'Scheduler profile for HPC clusters at TACC',
            inputMode: 'FIXED',
            notes: {},
          },
          {
            arg: '--job-name ${JobName}',
            name: 'Slurm job name',
            description:
              'Set the slurm job name to be identical to the Tapis job name.',
            inputMode: 'FIXED',
            notes: {},
          },
        ],
        envVariables: [],
        archiveFilter: {
          includes: [],
          excludes: ['tapisjob.out'],
          includeLaunchFiles: false,
        },
      },
      fileInputs: [
        {
          name: 'Input File',
          description: 'The archive file to be extracted.',
          inputMode: 'REQUIRED',
          autoMountLocal: true,
          sourceUrl: null,
          targetPath: '*',
        },
      ],
      fileInputArrays: [],
      nodeCount: 1,
      coresPerNode: 1,
      memoryMB: 100,
      maxMinutes: 10,
      subscriptions: [],
      tags: [],
    },
    tags: [],
    notes: {
      label: 'Extract Compressed File',
      hideNodeCountAndCoresPerNode: true,
    },
    uuid: '606463b8-366a-4f1a-bdd9-543b8214fd26',
    deleted: false,
    created: '2023-03-08T22:38:29.409242Z',
    updated: '2023-03-16T22:23:22.822513Z',
  },
  execSystems: execSystemsFixture,
  license: {
    type: null,
  },
};

export default extractApp;
