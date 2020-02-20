import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-regular-svg-icons';

import { Toast, ToastBody } from 'reactstrap';

const Notifications = () => {
  return (
    <div
      style={{
        position: 'absolute',
        left: '32px',
        bottom: '32px',
        zIndex: '999'
      }}
    >
      <Toast
        style={{
          width: '423px',
          maxWidth: '423px',
          height: '60px',
          backgroundColor: '#D2CCE7',
          borderRadius: '0px',
          border: '0',
          zIndex: '999'
        }}
      >
        <ToastBody
          style={{
            height: '60px',
            padding: '0px',
            display: 'flex'
          }}
        >
          <div
            style={{
              float: 'left',
              height: '60px',
              width: '50px',
              minWidth: '50px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRight: '1px solid #AFAFAF'
            }}
          >
            <FontAwesomeIcon icon={faBell} style={{ fontSize: '20px' }} />
          </div>
          <div
            style={{
              padding: '10px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <span>
              Sample Job ACDE finished successfully and this is a thing with
              multiple lines
            </span>
          </div>
        </ToastBody>
      </Toast>
    </div>
  );
};

export default Notifications;
