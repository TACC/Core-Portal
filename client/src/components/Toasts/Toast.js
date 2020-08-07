import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import PropTypes from 'prop-types';
import Snackbar from '@material-ui/core/Snackbar';
import Slide from '@material-ui/core/Slide';
import './Toast.scss';
import { STATUS_TEXT_MAP } from '../Jobs/JobsStatus';
import truncateMiddle from '../../utils/truncateMiddle';

const NotificationToast = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [notification, setNotification] = useState(undefined);
  const [transition, setTransition] = React.useState(undefined);

  const { toasts } = useSelector(
    state => state.notifications.list,
    shallowEqual
  );

  useEffect(() => {
    if (toasts.length && !notification) {
      // Set a new toast when we don't have an active one
      setNotification({ ...toasts[0] });
      setTransition(() => props => <Slide {...props} direction="right" />);
      setOpen(true);
    } else if (toasts.length && notification && open) {
      // Close an active toast when a new one is added
      setOpen(false);
    }
  }, [toasts]);

  const handleExited = () => {
    dispatch({
      type: 'NOTIFICATIONS_DISCARD_TOAST',
      payload: { pk: notification.pk }
    });
    setNotification(undefined);
  };

  const handleClose = (_event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
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
   * @return {string} Message
   *
   * @example
   * // returns "matlab-v9...20:02:00 is processing"
   * getToastMessage(n)
   */
  const getToastMessage = ({
    extra: { name, status },
    event_type: eventType,
    message
  }) => {
    switch (eventType) {
      case 'job':
        return `${truncateMiddle(name, 20)} ${STATUS_TEXT_MAP.toastMap(
          status
        )}`;
      case 'interactive_session_ready':
        return `${truncateMiddle(name, 20)} ${
          message ? message.toLowerCase() : 'session ready to view.'
        }`;
      default:
        return message;
    }
  };
  getToastMessage.propTypes = {
    extra: PropTypes.shape({
      name: PropTypes.string,
      status: PropTypes.string
    }),
    event_type: PropTypes.string.isRequired,
    message: PropTypes.string
  };
  getToastMessage.defaultProps = {
    extra: {},
    message: ''
  };

  return (
    <Snackbar
      key={notification ? notification.pk : undefined}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left'
      }}
      TransitionComponent={transition}
      open={open}
      autoHideDuration={3500}
      onClose={handleClose}
      onExited={handleExited}
      classes={{
        anchorOriginBottomLeft: 'notification-toast-container'
      }}
      ContentProps={{
        classes: {
          root: 'notification-toast',
          message: 'notification-toast-body'
        }
      }}
      message={
        <>
          <div className="notification-toast-icon-wrapper">
            <i className="icon icon-history" />
          </div>
          <div className="notification-toast-content">
            <span>
              {notification ? getToastMessage(notification) : undefined}
            </span>
          </div>
        </>
      }
    />
  );
};

export default NotificationToast;
