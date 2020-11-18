import { useSelector } from 'react-redux';
import { findSystemDisplayName } from 'utils/systems';
import truncateMiddle from '../../../utils/truncateMiddle';

const path = require('path');

const OPERATION_MAP = {
  mkdir: 'added',
  rename: 'renamed',
  upload: 'uploaded',
  move: 'moved',
  copy: 'copied',
  trash: 'moved',
  toastMap(operation, status, { response, body }) {
    console.log(response);
    console.log(body);
    const systemList = useSelector(state => state.systems.systemList);
    if (status !== 'SUCCESS') {
      switch (operation) {
        case 'mkdir':
          return 'Add folder failed';
        default:
          return `${operation} failed`;
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
        return `${type} ${mappedOp} to ${truncateMiddle(body.new_name, 20)}`;
      case 'mkdir':
        return `${body.dir_name} added`;
      case 'upload':
        // TODO: system name
        return `${type} ${mappedOp} to ${truncateMiddle(
          path.dirname(response.path),
          20
        )}`;
      case 'move':
      case 'copy': {
        const dest = path.join(
          findSystemDisplayName(systemList, body.dest_system),
          body.dest_path
        );
        return `${type} ${mappedOp} to ${truncateMiddle(dest, 20)}`;
      }
      default:
        return `${mappedOp}`;
    }
  }
};

function getOperationText(operation) {
  if (operation in OPERATION_MAP) {
    return OPERATION_MAP[operation];
  }
  return 'Unknown';
}

export default OPERATION_MAP;
