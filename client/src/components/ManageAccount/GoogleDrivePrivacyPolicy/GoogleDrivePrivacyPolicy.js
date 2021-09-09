import React from 'react';

const GoogleDrivePrivacyPolicy = () => (
  <div className="container">
    <h2>Google Drive Privacy Policy</h2>

    <p>
      By connecting your Google Drive account, you consent to giving this portal{' '}
      <strong>read</strong> and <strong>write</strong> access to your Google
      Drive account. This portal makes a secure connection to your Google Drive
      account to list your data in Data Files, and to copy data to and from
      TACC&lsquo;s data servers.
    </p>
    <p>
      We request this level of scope access (as opposed to read-only) to give
      you the best user experience, allowing you to upload field data and
      computational results directly to your Google Drive, while also viewing
      and using these files in experimental workflows by copying data from
      Google Drive to a directory you own in Data Files.
    </p>
    <p>
      <strong>
        We do not store any personal or identifying information from your Google
        Drive account
      </strong>
      , other than an access token and related file metadata, which is limited
      to mimeType, name, id, modifiedTime, fileExtension, size, and parents.
    </p>
  </div>
);


export default GoogleDrivePrivacyPolicy;
