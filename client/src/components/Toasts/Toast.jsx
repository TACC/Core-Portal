import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import PropTypes from 'prop-types';
import Snackbar from '@mui/material/Snackbar';
import Slide from '@mui/material/Slide';
import { Icon } from '_common';
import './Toast.scss';
import { STATUS_TEXT_MAP } from '../Jobs/JobsStatus';
import OPERATION_MAP from '../DataFiles/DataFilesStatus';
import truncateMiddle from '../../utils/truncateMiddle';

const NotificationToast = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [notification, setNotification] = useState(undefined);
  const [transition, setTransition] = React.useState(undefined);

  const { toasts } = useSelector(
    (state) => state.notifications.list,
    shallowEqual
  );

  useEffect(() => {
    if (toasts.length && !notification) {
      // Set a new toast when we don't have an active one
      setNotification({ ...toasts[0] });
      setTransition(() => (props) => <Slide {...props} direction="right" />);
      setOpen(true);
    } else if (toasts.length && notification && open) {
      // Close an active toast when a new one is added
      setOpen(false);
    }
  }, [toasts]);

  const handleExited = () => {
    dispatch({
      type: 'NOTIFICATIONS_DISCARD_TOAST',
      payload: { pk: notification.pk },
    });
    setNotification(undefined);
  };

  const handleClose = (_event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <Snackbar
      key={notification ? notification.pk : undefined}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      TransitionComponent={transition}
      open={open}
      autoHideDuration={3500}
      onClose={handleClose}
      TransitionProps={{ onExited: handleExited }}
      classes={{
        anchorOriginBottomLeft: 'notification-toast-container',
      }}
      ContentProps={{
        classes: {
          root: 'notification-toast',
          message: 'notification-toast-body',
        },
      }}
      message={<ToastMessage notification={notification} />}
    />
  );
};

export const ToastMessage = ({ notification }) => {
  const systemList = useSelector(
    (state) => state.systems.storage.configuration
  );
  const projectList = useSelector((state) => state.projects.listing.projects);
  return (
    <>
      {notification && (
        <>
          <div className="notification-toast-icon-wrapper">
            <Icon
              name="history"
              className={
                notification.status === 'ERROR' ? 'toast-is-error' : ''
              }
            />
          </div>
          <div className="notification-toast-content">
            <span>
              {getToastMessage(notification, systemList, projectList)}
            </span>
          </div>
        </>
      )}
    </>
  );
};
ToastMessage.propTypes = {
  notification: PropTypes.shape({
    status: PropTypes.string,
  }),
};
ToastMessage.defaultProps = {
  notification: undefined,
};

/**
 * Returns a human readable message from a job update event.
 *
 * @param {Object} notification - The notification event object
 * @param {Object} notification.extra - The embedded job status update object
 * @param {string} notification.extra.name - The job name
 * @param {string} notification.extra.status - The event status
 * @param {string} notification.message - The event message
 * @param {string} notification.event_type - The event type
 * @param {string} notification.status - The status of the notification event
 * @param {string} notification.operation - The notification operation type
 * @param {string} systemList - List of storage systems available to the user in Data Files
 * @return {string} Message
 *
 * @example
 * // returns "matlab-v9...20:02:00 is processing"
 * getToastMessage(n, systemList)
 */
export const getToastMessage = (
  { extra, event_type: eventType, message, status, operation },
  systemList,
  projectList
) => {
  switch (eventType) {
    case 'job':
      return `${truncateMiddle(extra.name, 20)} ${STATUS_TEXT_MAP.toastMap(
        extra.status
      )}`;
    case 'interactive_session_ready':
      return `${truncateMiddle(extra.name, 20)} ${
        message ? message.toLowerCase() : 'session ready to view.'
      }`;
    case 'data_files': {
      return OPERATION_MAP.toastMap(
        operation,
        status,
        systemList,
        projectList,
        extra
      );
    }
    default:
      return message;
  }
};
getToastMessage.propTypes = {
  extra: PropTypes.shape({
    name: PropTypes.string,
    status: PropTypes.string,
  }),
  event_type: PropTypes.string.isRequired,
  message: PropTypes.string,
  status: PropTypes.string,
  operation: PropTypes.string,
  systemList: PropTypes.list,
};
getToastMessage.defaultProps = {
  extra: {},
  message: '',
};

export default NotificationToast;
