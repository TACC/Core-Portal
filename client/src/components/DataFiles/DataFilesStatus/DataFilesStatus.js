import { findSystemOrProjectDisplayName } from 'utils/systems';
import truncateMiddle from 'utils/truncateMiddle';

const OPERATION_MAP = {
  mkdir: 'added',
  rename: 'renamed',
  upload: 'uploaded',
  move: 'moved',
  copy: 'copied',
  trash: 'moved',
  toastMap(operation, status, systemList, projectsList, { response }) {
    if (status !== 'SUCCESS') {
      switch (operation) {
        case 'mkdir':
          return 'Add folder failed';
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
        const dest =
          destPath === '/' || destPath === ''
            ? `${findSystemOrProjectDisplayName(
                // need to get file listing scheme here...
                response.systemId.includes('.project.') ? 'projects' : '',
                systemList,
                projectsList,
                response.systemId
              )}/`
            : destPath;
        return `${type} ${mappedOp} to ${truncateMiddle(dest, 20)}`;
      }
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
