import React from 'react';
import { Toast, ToastBody } from 'reactstrap';
import { string } from 'prop-types';
import './Toast.module.scss';

const NotificationToast = ({ message }) => {
  return (
    <div styleName="toast-container">
      <Toast styleName="toast">
        <ToastBody styleName="toast-body">
          <div styleName="toast-icon-wrapper">
            <i className="icon icon-nav-bell" />
          </div>
          <div styleName="toast-content">
            <span>{message}</span>
          </div>
        </ToastBody>
      </Toast>
    </div>
  );
};
NotificationToast.propTypes = {
  message: string.isRequired
};

export default NotificationToast;
