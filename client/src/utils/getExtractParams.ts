import { getParentPath } from './jobsUtil';
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
  const archivePath = getParentPath(file);
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
      schedulerOptions:
        defaultAllocation === 'VM'
          ? []
          : [
              // if running on VM, no need to pass allocation param
              {
                name: 'Project Allocation Account',
                description:
                  'The project allocation account associated with this job execution.',
                include: true,
                arg: `-A ${defaultAllocation}`,
              },
            ],
    },
  };
};
