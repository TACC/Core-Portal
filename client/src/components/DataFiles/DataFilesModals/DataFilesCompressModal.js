import React, { useMemo } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  Input,
  FormGroup
} from 'reactstrap';
import { LoadingSpinner, FormField, Icon } from '_common';
import { useHistory, useLocation } from 'react-router-dom';
import { isString, chain } from 'lodash';
import { Formik } from 'formik';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import './DataFilesCompressModal.module.scss';

const DataFilesCompressForm = ({ first, formRef }) => {
  const initialValues = {
    filename: `${first}.zip`,
    filetype: 'zip'
  };
  const validationSchema = yup.object().shape({
    filename: yup.string().required('The filename is required')
  });

  return (
    <Formik
      innerRef={formRef}
      initialValues={initialValues}
      validationSchema={validationSchema}
    >
      {({ values, setFieldValue, ...props }) => {
        const handleSelectChange = e => {
          const ext = e.target.value;
          setFieldValue('filetype', ext);
          if (!values.filename.includes(ext) && ext === 'tar.gz') {
            const newFileName = chain(values.filename.split('.'))
              .initial()
              .push(ext)
              .value()
              .join('.');
            setFieldValue('filename', newFileName);
          } else {
            const newFileName = chain(values.filename.split('.'))
              .initial()
              .initial()
              .push(ext)
              .value()
              .join('.');
            setFieldValue('filename', newFileName);
          }
        };
        return (
          <Form>
            <FormField label="Filename" name="filename" />
            <FormGroup>
              <Input
                type="select"
                name="filetype"
                bsSize="sm"
                onChange={handleSelectChange}
              >
                <option value="zip">zip</option>
                <option value="tar.gz">tar.gz</option>
              </Input>
            </FormGroup>
          </Form>
        );
      }}
    </Formik>
  );
};
DataFilesCompressForm.propTypes = {
  first: PropTypes.string.isRequired,
  formRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any })
  ]).isRequired
};

const DataFilesCompressModal = () => {
  const history = useHistory();
  const location = useLocation();
  const dispatch = useDispatch();
  const status = useSelector(
    state => state.files.operationStatus.compress,
    shallowEqual
  );

  const params = useSelector(
    state => state.files.params.FilesListing,
    shallowEqual
  );

  const isOpen = useSelector(state => state.files.modals.compress);
  const selectedFiles = useSelector(
    ({ files: { selected, listing } }) =>
      selected.FilesListing.map(i => ({
        ...listing.FilesListing[i]
      })),
    shallowEqual
  );
  const selected = useMemo(() => selectedFiles, [isOpen]);
  const formRef = React.useRef();
  const toggle = () =>
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation: 'compress', props: {} }
    });

  const onOpened = () => {
    dispatch({
      type: 'FETCH_FILES_MODAL',
      payload: { ...params, section: 'modal' }
    });
  };

  const onClosed = () => {
    dispatch({ type: 'DATA_FILES_MODAL_CLOSE' });
    if (isString(status)) {
      dispatch({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { status: {}, operation: 'compress' }
      });
      history.push(location.pathname);
    }
  };

  const compressCallback = () => {
    const { filename } = formRef.current.values;
    dispatch({
      type: 'DATA_FILES_COMPRESS',
      payload: { filename, files: selected }
    });
  };

  let buttonIcon;
  if (status === 'RUNNING') {
    buttonIcon = <LoadingSpinner placement="inline" />;
  } else if (status === 'ERROR') {
    buttonIcon = <Icon name="alert" />;
  } else {
    buttonIcon = null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpened={onOpened}
      onClosed={onClosed}
      toggle={toggle}
      className="dataFilesModal"
    >
      <ModalHeader toggle={toggle}>Compress Files</ModalHeader>
      <ModalBody>
        <DataFilesCompressForm
          formRef={formRef}
          first={(selectedFiles[0] && selectedFiles[0].name) || ''}
        />
        <p>
          A job to compress your files will be submitted on your behalf. You can
          check the status of this job on your Dashboard, and your compressed
          file will appear in this directory.
        </p>
        {status === 'SUCCESS' && (
          <span style={{ color: 'green' }}>
            Successfully started compress job
          </span>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          onClick={compressCallback}
          className="data-files-btn"
          disabled={status === 'RUNNING'}
          styleName="submit-button"
        >
          {buttonIcon}
          <span styleName={buttonIcon ? 'with-icon' : ''}>Compress</span>
        </Button>
        <Button
          color="secondary"
          className="data-files-btn-cancel"
          onClick={toggle}
        >
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DataFilesCompressModal;
