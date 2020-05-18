import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { UncontrolledAlert, Col, Row, Container } from 'reactstrap';
import { isEmpty } from 'lodash';
import { LoadingSpinner } from '_common';
import Sidebar from '../Sidebar';
import {
  RequiredInformation,
  ChangePassword,
  Licenses,
  ThirdPartyApps,
  OptionalInformation
} from './ManageAccountTables';
import ManageAccountModals from './ManageAccountModals';
import './ManageAccount.scss';

const ManageAccountView = () => {
  const {
    isLoading,
    errors,
    data: { licenses, integrations }
  } = useSelector(state => state.profile);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch({ type: 'GET_PROFILE_DATA' });
  }, [dispatch, isLoading]);
  return (
    <Container fluid className="manage-account-wrapper">
      <Sidebar />
      <Container fluid>
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
                  <UncontrolledAlert color="danger">
                    Unable to get your profile data
                  </UncontrolledAlert>
                )}
                {errors.fields && (
                  <UncontrolledAlert color="danger">
                    Unable to get form fields
                  </UncontrolledAlert>
                )}
                <RequiredInformation />
                <OptionalInformation />
                <ManageAccountModals />
              </>
            )}
          </Col>
          <Col lg="4">
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                {!isEmpty(licenses) && <Licenses />}
                {!isEmpty(integrations) && <ThirdPartyApps />}
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
