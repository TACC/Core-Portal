import React from 'react';
import {  SectionTableWrapper } from '_common';
import styles from './APCDAccountManagement.module.scss';

function APCDAccountManagement() {
  return (
    <SectionTableWrapper
      header="My Account"
      contentClassName={styles['root']}
    >
      <a className="wb-link" href="https://utexas.edu" target="_blank" rel="noreferrer">Update Profile and Email address</a>
      <a className="wb-link" href="https://utexas.edu" target="_blank" rel="noreferrer">Change Password</a>
    </SectionTableWrapper>
  )
}

export default APCDAccountManagement;
