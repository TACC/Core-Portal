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
import { LoadingSpinner, FormField, Icon, InlineMessage } from '_common';
import { useHistory, useLocation } from 'react-router-dom';
import { Formik } from 'formik';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import './DataFilesCompressModal.module.scss';

const DataFilesCompressForm = ({ singleFile, formRef, isDisabled }) => {
  const initialValues = {
    filenameDisplay: `${singleFile || ''}`,
    filetype: '.zip'
  };
  const validationSchema = yup.object().shape({
    filenameDisplay: yup
      .string()
      .trim('The filename cannot include leading and trailing spaces')
      .strict(true)
      .required('The filename is required')
  });

  return (
    <Formik
      innerRef={formRef}
      initialValues={initialValues}
      validationSchema={validationSchema}
    >
      {({ values, setFieldValue }) => {
        const handleSelectChange = e => {
          setFieldValue('filetype', e.target.value);
        };
        return (
          <Form>
            <FormField
              label="Filename"
              name="filenameDisplay"
              disabled={isDisabled}
            />
            <FormGroup>
              <Input
                type="select"
                name="filetype"
                bsSize="sm"
                onChange={handleSelectChange}
                disabled={isDisabled}
              >
                <option value=".zip">.zip</option>
                <option value=".tar.gz">.tar.gz</option>
              </Input>
            </FormGroup>
          </Form>
        );
      }}
    </Formik>
  );
};
DataFilesCompressForm.propTypes = {
  singleFile: PropTypes.string,
  formRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Object) })
  ]),
  isDisabled: PropTypes.bool.isRequired
};
DataFilesCompressForm.defaultProps = {
  formRef: null,
  singleFile: null
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
    if (status) {
      dispatch({
        type: 'DATA_FILES_SET_OPERATION_STATUS',
        payload: { status: {}, operation: 'compress' }
      });
      history.push(location.pathname);
    }
  };

  const compressCallback = () => {
    const { filenameDisplay, filetype } = formRef.current.values;
    const filename = `${filenameDisplay.replace(' ', '')}${filetype}`;
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
  const firstFile = selectedFiles[0] ? selectedFiles[0].name : '';
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
          singleFile={selectedFiles.length > 1 ? null : firstFile}
          isDisabled={status === 'RUNNING' || status === 'SUCCESS'}
        />
        <p>
          A job to compress your files will be submitted on your behalf. You can
          check the status of this job on your Dashboard, and your compressed
          file will appear in this directory.
        </p>
      </ModalBody>
      <ModalFooter>
        <InlineMessage isVisible={status === 'SUCCESS'} type="success">
          Successfully started compress job
        </InlineMessage>
        <Button
          onClick={compressCallback}
          className="data-files-btn"
          disabled={status === 'RUNNING' || status === 'SUCCESS'}
          styleName="submit-button"
        >
          {buttonIcon}
          <span styleName={buttonIcon ? 'with-icon' : ''}>Compress</span>
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DataFilesCompressModal;
