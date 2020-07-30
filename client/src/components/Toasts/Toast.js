import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import Snackbar from '@material-ui/core/Snackbar';
import Slide from '@material-ui/core/Slide';
import './Toast.scss';

const NotificationToast = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [messageInfo, setMessageInfo] = useState(undefined);
  const [transition, setTransition] = React.useState(undefined);

  const { toasts } = useSelector(
    state => state.notifications.list,
    shallowEqual
  );

  useEffect(() => {
    if (toasts.length && !messageInfo) {
      // Set a new toast when we don't have an active one
      setMessageInfo({ ...toasts[0] });
      setTransition(() => props => <Slide {...props} direction="right" />);
      setOpen(true);
    } else if (toasts.length && messageInfo && open) {
      // Close an active toast when a new one is added
      setOpen(false);
    }
  }, [toasts]);

  const handleExited = () => {
    dispatch({
      type: 'NOTIFICATIONS_DISCARD_TOAST',
      payload: { pk: messageInfo.pk }
    });
    setMessageInfo(undefined);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Snackbar
        key={messageInfo ? messageInfo.pk : undefined}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        TransitionComponent={transition}
        open={open}
        autoHideDuration={4000}
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
              <span>{messageInfo ? messageInfo.message : undefined}</span>
            </div>
          </>
        }
        ClickAwayListener={{ mouseEvent: false }}
      />
    </>
  );
};

export default NotificationToast;
