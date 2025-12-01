import { getParentPath } from './jobsUtil';
import { TPortalSystem, TTapisFile } from './types';

export const getCompressParams = (
  files: TTapisFile[],
  archiveFileName: string,
  compressionType: string,
  compressApp: { id: string; version: string },
  defaultAllocation: string,
  defaultPrivateSystem?: TPortalSystem
) => {
  const fileInputs = [
    {
      name: 'Target path to be compressed',
      sourceUrls: files.map((file) => `tapis://${file.system}/${file.path}`),
    },
  ];

  let archivePath = getParentPath(files[0]);
  let archiveSystem = files[0].system;

  return {
    fileInputArrays: fileInputs,
    name: `${compressApp.id}-${compressApp.version}_${
      new Date().toISOString().split('.')[0]
    }`,
    archiveSystemId: archiveSystem,
    archiveSystemDir: archivePath,
    archiveOnAppError: false,
    appId: compressApp.id,
    appVersion: compressApp.version,
    parameterSet: {
      appArgs: [
        {
          name: 'Archive File Name',
          arg: archiveFileName,
        },
        {
          name: 'Compression Type',
          arg: compressionType,
        },
      ],
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
