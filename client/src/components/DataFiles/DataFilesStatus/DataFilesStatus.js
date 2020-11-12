import truncateMiddle from '../../../utils/truncateMiddle';

const path = require('path');

const OPERATION_MAP = {
  mkdir: 'created',
  rename: 'renamed',
  upload: 'uploaded',
  move: 'moved',
  copy: 'copied',
  trash: 'trash',
  toastMap(operation, status, { response, body }) {
    /* Post-process mapped status message to get a toast message translation. */
    const mappedStatus = getStatusText(operation);
    if (status !== 'SUCCESS') {
      return `${operation} failed`;
    }
    switch (operation) {
      case 'trash':
        return 'moved to trash';
      case 'Unknown':
        return 'received an unknown operation';
      case 'rename':
        return `renamed to ${truncateMiddle(body.new_name, 20)}`;
      case 'mkdir':
        return `${body.dir_name} created`;
      case 'upload':
        return `uploaded to ${path.dirname(response.path)}`;
      case 'move':
      case 'copy':
        return `${mappedStatus} to ${truncateMiddle(body.dest_path, 20)}`;
      default:
        return `${mappedStatus}`;
    }
  }
};

function getStatusText(status) {
  if (status in OPERATION_MAP) {
    return OPERATION_MAP[status];
  }
  return 'Unknown';
}

export default OPERATION_MAP;
