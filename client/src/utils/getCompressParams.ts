import { TPortalSystem, TTapisFile } from './types';

export const getCompressParams = (
  files: TTapisFile[],
  archiveFileName: string,
  compressionType: string,
  compressApp: { id: string; version: string },
  defaultAllocation: string,
  defaultPrivateSystem?: TPortalSystem
) => {
  const fileInputs = files.map((file) => ({
    sourceUrl: `tapis://${file.system}/${file.path}`,
  }));

  let archivePath, archiveSystem;

  // if (defaultPrivateSystem) {
  //   archivePath = defaultPrivateSystem.homeDir;
  //   archiveSystem = defaultPrivateSystem.system;
  // } else {
  //   archivePath = `${files[0].path.slice(0, -files[0].name.length)}`;
  //   archiveSystem = files[0].system;
  // }

  archivePath = `${files[0].path.slice(0, -files[0].name.length)}`;
  archiveSystem = files[0].system;

  return {
    fileInputs: fileInputs,
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
