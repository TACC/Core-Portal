import React from 'react';
import { Navbar } from 'reactstrap';
import { useSelector } from 'react-redux';
import RequestAccessForm from './RequestAccessForm';
import BrowserChecker from '../_common/BrowserChecker';
import styles from './RequestAccess.module.css';

function RequestAccess() {
  const portalName = useSelector((state) => state.workbench.portalName);
  return (
    <>
      <Navbar className={styles['request-access-title']}>Request Access</Navbar>
      <div className={styles['request-access-wrapper']}>
        <h2 className={styles['request-access-h2']}>
          Request Access to the {portalName} Portal Platform
        </h2>
        <h4>
          <i>The {portalName} Portal is for authorized users only.</i>
        </h4>
        <p>
          Please create a TACC username and password by following the
          instructions below:
        </p>
        <ol>
          <li>
            Visit{' '}
            <a
              className={styles['request-access-link']}
              href="https://portal.tacc.utexas.edu/account-request"
            >
              https://portal.tacc.utexas.edu/account-request
            </a>
          </li>
          <li>
            Read the <b>Request an Account</b> information and click the{' '}
            <b>Continue to Create an Account</b> button at the bottom of the
            page.
          </li>
          <li>
            Read the <b>Acceptable Use Policy</b> and click the{' '}
            <b>I agree to the TACC Acceptable Use Policy</b> button at the
            bottom of the page.
          </li>
          <li>
            Fill out the <b>Account Request</b> form and click the{' '}
            <b>Request account</b> button at the bottom of the page.
          </li>
          <li>
            You will be contacted by TACC staff regarding your account and
            allocation request. When your account is approved, you will receive
            a verification e-mail. You must click the link provided in the
            e-mail and login to{' '}
            <a
              className={styles['request-access-link']}
              href="https://portal.tacc.utexas.edu"
            >
              portal.tacc.utexas.edu
            </a>{' '}
            at least once.
          </li>
        </ol>
        <p>
          Once you have created your <b>TACC Username and Password</b> you may
          fill in the access request form below.
        </p>
        <p>
          After accessing the {portalName} portal, configure{' '}
          <b>
            <a
              className={styles['request-access-link']}
              href="https://portal.tacc.utexas.edu/account-profile/-/mfa"
            >
              Multifactor Authentication (MFA)
            </a>
          </b>{' '}
          to use the command line.
        </p>
        <BrowserChecker />
        <RequestAccessForm />
      </div>
    </>
  );
}

export default RequestAccess;
