import React from 'react';
import Sidebar from '../Sidebar';
import { RequiredInformation } from './ManageAccountTables';
import './ManageAccount.scss';

const ManageAccountHeader = () => {
  return (
    <div className="manage-account-header">
      <span>Manage Account</span>
    </div>
  );
};

const ManageAccountLayout = () => {
  return (
    <div className="manage-account-wrapper">
      <div>
        <Sidebar />
      </div>
      <div className="manage-account-content">
        <ManageAccountHeader />
        <div className="user-profile">
          <div className="user-profile-main">
            <RequiredInformation />
          </div>
        </div>
      </div>
    </div>
  );
};

const ManageAccountView = () => {
  return <ManageAccountLayout />;
};

export default ManageAccountView;
