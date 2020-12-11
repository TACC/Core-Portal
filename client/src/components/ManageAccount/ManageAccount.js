import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Col, Row, Container } from 'reactstrap';
import { isEmpty } from 'lodash';
import { LoadingSpinner } from '_common';
import {
  RequiredInformation,
  ChangePassword,
  Licenses,
  OptionalInformation,
  Integrations
} from './ManageAccountTables';
import {
  ChangePasswordModal,
  EditOptionalInformationModal,
  EditRequiredInformationModal
} from './ManageAccountModals';
import './ManageAccount.scss';

const ManageAccountView = () => {
  const {
    isLoading,
    errors,
    data: { licenses, integrations }
  } = useSelector(state => state.profile);
  const dispatch = useDispatch();
  const welcomeMessages = useSelector(state => state.welcomeMessages);
  const onDismissWelcome = section => {
    const newMessagesState = {
      ...welcomeMessages,
      [section]: false
    };
    dispatch({ type: 'SAVE_WELCOME', payload: newMessagesState });
  };
  useEffect(() => {
    dispatch({ type: 'GET_PROFILE_DATA' });
  }, [dispatch, isLoading]);
  return (
    <Container fluid className="manage-account-wrapper">
      <Container fluid className="manage-account-content">
        <Alert
          isOpen={welcomeMessages.profile}
          toggle={() => onDismissWelcome('profile')}
          color="secondary"
          className="welcomeMessageGeneral"
        >
          This page allows you to manage your account profile, change your
          password and view software licenses.
        </Alert>
        <Row className="manage-account-header">
          <h5>Manage Account</h5>
          <Link to="/workbench/dashboard" style={{ fontWeight: '500' }}>
            Back to Dashboard
          </Link>
        </Row>
        <Row className="user-profile">
          <Col lg="8" className="user-profile-main">
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                {errors.data && (
                  <Alert color="danger">Unable to get your profile data</Alert>
                )}
                {errors.fields && (
                  <Alert color="danger">Unable to get form fields</Alert>
                )}
                <RequiredInformation />
                <OptionalInformation />
                <ChangePasswordModal />
                <EditOptionalInformationModal />
                <EditRequiredInformationModal />
              </>
            )}
          </Col>
          <Col lg="4">
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                {!isEmpty(licenses) && <Licenses />}
                {!isEmpty(integrations) && <Integrations />}
                <ChangePassword />
              </>
            )}
          </Col>
        </Row>
      </Container>
    </Container>
  );
};

export default React.memo(ManageAccountView);
