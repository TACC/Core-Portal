import { TTapisFile } from './types';

export const getExtractParams = (
  file: TTapisFile,
  extractApp: {
    id: string;
    version: string;
  },
  latestExtract: any,
  defaultAllocation: string
) => {
  const inputFile = `tapis://${file.system}/${file.path}`;
  const archivePath = `${file.path.slice(0, -file.name.length)}` || '.'; // set archive path to root if no enclosing folder;
  return {
    fileInputs: [
      {
        name: 'Input File',
        sourceUrl: inputFile,
      },
    ],
    name: `${extractApp.id}-${extractApp.version}_${
      new Date().toISOString().split('.')[0]
    }`,
    archiveSystemId: file.system,
    archiveSystemDir: archivePath,
    archiveOnAppError: false,
    appId: extractApp.id,
    appVersion: extractApp.version,
    parameterSet: {
      appArgs: [],
      schedulerOptions: [
        {
          name: 'TACC Allocation',
          description: 'The TACC allocation associated with this job execution',
          include: true,
          arg: `-A ${defaultAllocation}`,
        },
      ],
    },
  };
};
