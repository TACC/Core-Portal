import React, { useState } from 'react';
import { useHistory, useLocation, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '_common';
import { FileInputDropZone, Section } from '_common';
import { useSystems } from 'hooks/datafiles';
import { useUpload } from 'hooks/datafiles/mutations';
import DataFilesUploadModalListingTable from '../DataFiles/DataFilesModals/DataFilesUploadModalListing/DataFilesUploadModalListingTable.jsx';
import styles from './Submissions.module.scss';

const SubmissionsUpload = () => {
  const history = useHistory();
  const location = useLocation();
  const reloadCallback = () => {
    history.push(location.pathname);
  };

  const { data: allSystems } = useSystems();
  const submissionSystem = allSystems.find(
    (s) => s.name === 'APCD Submissions'
  );
  const uploadPath = '';

  const { status, upload } = useUpload();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [rejectedFiles, setRejectedFiles] = useState([]);

  const uploadStart = () => {
    const filteredFiles = uploadedFiles.filter(
      (f) => status[f.id] !== 'SUCCESS' && !rejectedFiles.includes(f)
    );
    filteredFiles.length > 0 &&
      upload({
        system: submissionSystem.system,
        path: uploadPath,
        files: filteredFiles,
        reloadCallback,
      });
  };

  const dropZoneDisabled = uploadedFiles.length > 0;
  const submitDisabled = Object.values(uploadedFiles).every((f) => {
    return status[f.id] === 'SUCCESS' || status[f.id] === 'ERROR';
  });

  const selectFiles = (acceptedFiles) => {
    const newFiles = [];
    const newAcceptedFiles = acceptedFiles.filter(
      (af) =>
        uploadedFiles.filter(
          (uf) => uf.data.path === af.path && uf.data.size === af.size
        ).length === 0
    );
    newAcceptedFiles.forEach((file) => {
      newFiles.push({ data: file, id: uuidv4() });
    });
    setUploadedFiles((files) => [...files, ...newFiles]);
  };

  const removeFiles = () => {
    setUploadedFiles((uploadedFiles) => []);
  };

  const onRejectedFiles = (oversizedFiles) => {
    const newFiles = [];
    const newRejectedFiles = oversizedFiles.filter(
      (of) =>
        rejectedFiles.filter((rf) => rf.data.path === of.path).length === 0
    );
    newRejectedFiles.forEach((file) => {
      newFiles.push({ data: file, id: uuidv4() });
    });
    setUploadedFiles((files) => [...files, ...newFiles]);
    setRejectedFiles((files) => [...files, ...newFiles]);
  };

  return (
    <div>
      <div className={styles['container']} disabled={dropZoneDisabled}>
        <FileInputDropZone
          onSetFiles={selectFiles}
          onRejectedFiles={onRejectedFiles}
          maxSize={2147483648}
          maxSizeMessage="Max File Size: 2GB"
        />
      </div>
      {uploadedFiles.length > 0 && (
        <div>
          <div className={styles['listing']}>
            <span className={styles['listing-header']}>
              File Ready for Upload:
            </span>
            <DataFilesUploadModalListingTable
              uploadedFiles={uploadedFiles}
              rejectedFiles={rejectedFiles}
              setUploadedFiles={setUploadedFiles}
              submission={true}
            />
          </div>
          {submitDisabled ? (
            <Button
              className={styles['listing-button']}
              type="secondary"
              size="long"
              onClick={removeFiles}
            >
              Clear
            </Button>
          ) : (
            <Button
              className={styles['listing-button']}
              type="primary"
              size="long"
              onClick={uploadStart}
            >
              Upload File(s)
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

const Submissions = () => {
  return (
    <Section
      bodyClassName="has-loaded-dashboard"
      messageComponentName="SUBMISSIONS"
      introMessageText={
        <span>
          For security reasons, files uploaded here cannot be accessed after
          uploading.
          {/* prettier-ignore */}
          <strong>
            If a file exceeds 2GB, refer to the{' '}
            <Link to="/help/data-transfer-guide" className="wb-link">Large Data Transfer Guide</Link>.
          </strong>
        </span>
      }
      header="Data Submission"
      contentLayoutName="oneColumn"
      contentShouldScroll
      content={<SubmissionsUpload />}
    />
  );
};

export default Submissions;
