import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  const { isLoading } = useSelector(state => state.profile);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({ type: 'GET_PROFILE_DATA' });
  }, [dispatch]);
  return (
    <div className="manage-account-wrapper">
      <div>
        <Sidebar />
      </div>
      <div className="manage-account-content">
        <ManageAccountHeader />
        <div className="user-profile">
          <div className="user-profile-main">
            {isLoading ? 'Loading' : <RequiredInformation />}
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
