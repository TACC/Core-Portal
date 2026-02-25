import React, { useState } from 'react';
import { useHistory, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '_common';
import { FileInputDropZone, Section, LoadingSpinner } from '_common';
import { useSystems, useTapisToken } from 'hooks/datafiles';
import { useUpload } from 'hooks/datafiles/mutations';
import DataFilesUploadModalListingTable from '../DataFiles/DataFilesModals/DataFilesUploadModalListing/DataFilesUploadModalListingTable.jsx';
import styles from './Submissions.module.scss';
import { fetchUtil } from 'utils/fetchUtil';
import * as ROUTES from '../../constants/routes';

export const SubmissionsUpload = () => {
  const history = useHistory();
  const location = useLocation();
  const reloadCallback = () => {
    history.push(location.pathname);
  };

  const { data: allSystems } = useSystems();
  const { data: tapisToken } = useTapisToken();
  const submissionSystem = allSystems.find((s) => s.type === 'submission');
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
        tapisToken,
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
    <div className={styles['container']}>
      <div disabled={dropZoneDisabled}>
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
              disabled={!tapisToken}
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
  const getSubmitterRole = async () => {
    const response = await fetchUtil({
      url: '/submissions/check-submitter-role/',
    });
    return response;
  };

  const useSubmitterRole = () => {
    const query = useQuery({
      queryKey: ['submitter-role'],
      queryFn: getSubmitterRole,
    });
    return query;
  };

  const { data, isLoading } = useSubmitterRole();

  const is_submitter = data?.is_submitter;

  const Unauthorized = () => (
    <>
      <h2>
        You are not currently authorized for uploads. Please contact the UT
        Health office or{' '}
        <Link
          className="wb-link"
          to={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/create`}
        >
          submit a ticket.
        </Link>
      </h2>
    </>
  );

  let contentClassName = '';
  if (!is_submitter) {
    contentClassName = styles['center'];
  }

  return (
    <Section
      bodyClassName="has-loaded-dashboard"
      messageComponentName="SUBMISSIONS"
      header="Data Submission"
      contentLayoutName="oneColumn"
      contentShouldScroll
      contentClassName={contentClassName}
      content={
        isLoading ? (
          <LoadingSpinner />
        ) : is_submitter ? (
          <SubmissionsUpload />
        ) : (
          <Unauthorized />
        )
      }
    />
  );
};

export default Submissions;
