import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Col, Row } from 'reactstrap';
import { isEmpty } from 'lodash';
import { LoadingSpinner, Section } from '_common';
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
  useEffect(() => {
    dispatch({ type: 'GET_PROFILE_DATA' });
  }, [dispatch, isLoading]);
  return (
    /* !!!: Temporary bad indentation to make simpler PR diff */
    /* eslint-disable prettier/prettier */
    <Section
      routeName="PROFILE"
      header="Manage Account"
      headerActions={
        <Link to="/workbench/dashboard" className="wb-link">
          Back to Dashboard
        </Link>
      }
      content={
        // HACK: <Container fluid> output replicated via `contentClassName`
        // TODO: Support Account layout via `contentLayoutName`
        <>
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
        </>
      }
      contentClassName="manage-account-content container-fluid"
      contentLayoutName="oneColumn"
      contentShouldScroll
    />
    /* eslint-enable prettier/prettier */
  );
};

export default React.memo(ManageAccountView);
