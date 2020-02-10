import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from '../Sidebar';
import {
  RequiredInformation,
  ChangePassword,
  Licenses,
  ThirdPartyApps
} from './ManageAccountTables';
import './ManageAccount.scss';

const ManageAccountHeader = () => {
  return (
    <div className="manage-account-header">
      <h5>Manage Account</h5>
      <Link to="/workbench/dashboard">Back to Dashboard</Link>
    </div>
  );
};

const ManageAccountLayout = () => {
  const { isLoading } = useSelector(state => state.profile);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({ type: 'GET_PROFILE_DATA' });
  }, [dispatch]);
  return (
    <div className="manage-account-wrapper">
      <Sidebar />
      <div className="manage-account-content">
        <ManageAccountHeader />
        <div className="user-profile">
          <div className="user-profile-main">
            {isLoading ? 'Loading' : <RequiredInformation />}
          </div>
          <div className="user-profile-side">
            <Licenses />
            <ThirdPartyApps />
            <ChangePassword />
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
