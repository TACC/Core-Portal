import { TTapisFile } from './types';

export const getExtractParams = (
    file: TTapisFile,
    latestExtract: any,
    defaultAllocation: string
) => {
    const inputFile = `tapis://${file.system}/${file.path}`;
    const archivePath = `${file.path.slice(0, -file.name.length)}`;
    return {
        job: {
          fileInputs: [
            {
              name: 'Input File',
              sourceUrl: inputFile,
            },
          ],
          name: `${latestExtract.definition.id}-${
            latestExtract.definition.version
          }_${new Date().toISOString().split('.')[0]}`,
          archiveSystemId: file.system,
          archiveSystemDir: archivePath,
          archiveOnAppError: false,
          appId: latestExtract.definition.id,
          appVersion: latestExtract.definition.version,
          parameterSet: {
            appArgs: [],
            schedulerOptions: [
              {
                name: 'TACC Allocation',
                description:
                  'The TACC allocation associated with this job execution',
                include: true,
                arg: `-A ${defaultAllocation}`,
              },
            ],
          },
          execSystemId: latestExtract.definition.jobAttributes.execSystemId,
        },
    };
};