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
  FormGroup,
  InputGroupAddon
} from 'reactstrap';
import { LoadingSpinner, FormField, Icon, InlineMessage } from '_common';
import { useHistory, useLocation } from 'react-router-dom';
import { isString } from 'lodash';
import { Formik } from 'formik';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import './DataFilesCompressModal.module.scss';

const makeDate = () => {
  const date = new Date();
  const d = new Date(date);
  let month = `${d.getMonth() + 1}`;
  let day = `${d.getDate()}`;
  const year = d.getFullYear();

  if (month.length < 2) month = `0${month}`;
  if (day.length < 2) day = `0${day}`;

  return [year, month, day].join('-');
};

const DataFilesCompressForm = ({ singleFile, formRef }) => {
  const dateTimeStr = makeDate();
  const initialValues = {
    filenameDisplay: `${singleFile ? dateTimeStr : ''}`,
    filetype: '.zip'
  };
  const validationSchema = yup.object().shape({
    filenameDisplay: yup.string().required('The filename is required')
  });

  return (
    <Formik
      innerRef={formRef}
      initialValues={initialValues}
      validationSchema={validationSchema}
    >
      {({ values, setFieldValue }) => {
        const handelSelectChange = e => {
          setFieldValue('filetype', e.target.value);
        };
        return (
          <Form>
            <FormGroup>
              <FormField
                label="Filename"
                name="filenameDisplay"
                addonType="append"
                addon={
                  <InputGroupAddon addonType="append">
                    <Input
                      type="select"
                      name="filetype"
                      bsSize="sm"
                      onChange={handelSelectChange}
                    >
                      <option value=".zip">.zip</option>
                      <option value=".tar.gz">.tar.gz</option>
                    </Input>
                  </InputGroupAddon>
                }
              />
            </FormGroup>
          </Form>
        );
      }}
    </Formik>
  );
};
DataFilesCompressForm.propTypes = {
  singleFile: PropTypes.bool.isRequired,
  formRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Object) })
  ])
};
DataFilesCompressForm.defaultProps = {
  formRef: null
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
    const { filenameDisplay, filetype } = formRef.current.values;
    const filename = `${filenameDisplay.split(' ').join('')}${filetype}`;
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
          singleFile={selectedFiles.length === 1}
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
