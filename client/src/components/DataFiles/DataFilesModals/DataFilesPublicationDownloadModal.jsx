import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { Button, DescriptionList, LoadingSpinner, Message } from '_common';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import styles from './DataFilesPublicationRequestModal.module.scss';
import { formatDate, formatDateTime } from 'utils/timeFormat';
import { useFileDetail, useModal } from 'hooks/datafiles';

export function toBytes(bytes) {
  if (bytes === 0) return '0 bytes';
  if (!bytes) return '-';
  const units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
  const orderOfMagnitude = Math.floor(Math.log(bytes) / Math.log(1024));
  const precision = orderOfMagnitude === 0 ? 0 : 1;
  const bytesInUnits = bytes / Math.pow(1024, orderOfMagnitude);
  return `${bytesInUnits.toFixed(precision)} ${units[orderOfMagnitude]}`;
}

const DataFilesPublicationDownloadModal = () => {
  const dispatch = useDispatch();
  const { toggle: toggleModal, getStatus, getProps } = useModal();
  const { projectId, rootSystem } = getProps('publicationDownload') || {};
  const archiveProjectId = (projectId ?? '').split('published.')[1];

  const isOpen = getStatus('publicationDownload') ?? false;

  const toggle = useCallback(() => {
    toggleModal({ operation: 'publicationDownload', props: {} });
  }, []);

  const archivePath = `/archive/${archiveProjectId}/${archiveProjectId}_archive.zip`;
  const { isLoading, isError, data } = useFileDetail(
    'tapis',
    rootSystem,
    'public',
    archivePath,
    isOpen
  );
  const archiveSize = data?.length ?? 0;
  const maxFileSize = 2 * 1024 * 1024 * 1024;
  useEffect(() => {
    if (isOpen && archiveSize > maxFileSize) {
      toggleModal({ operation: 'largeDownload' });
      toggleModal({ operation: 'publicationDownload', props: {} });
    }
  }, [archiveSize, maxFileSize]);

  const downloadFile = () => {
    dispatch({
      type: 'DATA_FILES_DOWNLOAD',
      payload: { file: { system: rootSystem, path: archivePath } },
    });
  };

  return (
    <>
      <Modal
        size="lg"
        isOpen={isOpen}
        toggle={toggle}
        className={styles['modal-dialog']}
      >
        <ModalHeader toggle={toggle} charCode="&#xe912;">
          Download Publication {archiveProjectId}
        </ModalHeader>
        <ModalBody>
          {isError && (
            <Message type="error">
              The requested data could not be accessed.
            </Message>
          )}
          {isLoading && <LoadingSpinner />}
          {!!data && !isLoading && !isError && (
            <>
              <p>
                This download is a ZIP file of the complete project dataset. The
                size of the ZIP file is <strong>{toBytes(data?.length)}</strong>
                .
              </p>
              <p
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <Button onClick={downloadFile}>Download</Button>
              </p>
            </>
          )}
        </ModalBody>
      </Modal>
    </>
  );
};

export default DataFilesPublicationDownloadModal;
