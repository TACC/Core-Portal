import { findSystemDisplayName, findProjectTitle } from 'utils/systems';
import truncateMiddle from 'utils/truncateMiddle';

const OPERATION_MAP = {
  mkdir: 'added',
  rename: 'renamed',
  upload: 'uploaded',
  move: 'moved',
  copy: 'copied',
  trash: 'moved',
  makepublic: 'copied',
  toastMap(operation, status, systemList, projectList, { response }) {
    if (status !== 'SUCCESS') {
      switch (operation) {
        case 'mkdir':
          return 'Add folder failed';
        case 'makepublic':
          return 'Copy to Public Data failed';
        default:
          return `${operation.charAt(0).toUpperCase() +
            operation.slice(1)} failed`;
      }
    }

    /* Post-process mapped operation message to get a toast message translation. */
    const type = response.nativeFormat === 'dir' ? 'Folder' : 'File';
    const mappedOp = getOperationText(operation);
    switch (operation) {
      case 'trash':
        return `${type} ${mappedOp} to trash`;
      case 'Unknown':
        return `${type} received an unknown operation`;
      case 'rename':
        return `${type} ${mappedOp} to ${truncateMiddle(response.name, 20)}`;
      case 'mkdir':
        return `${response.name} ${mappedOp}`;
      case 'upload':
      case 'move':
      case 'copy': {
        const destPath = response.path
          .split('/')
          .slice(0, -1)
          .join('/');
        const projectName = findProjectTitle(projectList, response.systemId);

        const srcSystem =
          response.source.split('/')[0] === 'https:'
            ? response.source.split('/')[7]
            : response.source.split('/')[2];
        const destSystem = response.systemId;

        let op = mappedOp;
        let dest;

        if (srcSystem !== destSystem) {
          if (mappedOp === 'copied') {
            op = 'started copying';
          } else {
            op = 'started moving';
          }
        }

        if (projectName) {
          dest =
            destPath === '/' || destPath === '' ? `${projectName}/` : destPath;
        } else {
          dest =
            destPath === '/' || destPath === ''
              ? `${findSystemDisplayName(systemList, response.systemId)}/`
              : destPath;
        }

        return `${type} ${op} to ${truncateMiddle(dest, 20)}`;
      }
      case 'makepublic':
        return `${type} ${mappedOp} to Public Data`;
      default:
        return `${mappedOp}`;
    }
  }
};

export function getOperationText(operation) {
  if (operation in OPERATION_MAP) {
    return OPERATION_MAP[operation];
  }
  return 'Unknown';
}

export default OPERATION_MAP;
