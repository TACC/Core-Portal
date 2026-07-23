import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Modal, ModalHeader, ModalBody, ModalFooter, FormText } from 'reactstrap';
import { Form, Formik } from 'formik';
import { fetchUtil } from 'utils/fetchUtil';
import { Button, LoadingSpinner, Section } from '_common';
import { DynamicForm } from '_common/Form/DynamicForm';
import { useSelectedFiles, useFileListing } from 'hooks/datafiles';
import { ToolbarButton } from '../../../DataFiles/DataFilesToolbar/DataFilesToolbar';
import styles from './DataFilesToolbarAddon.module.scss';

const DataFilesToolbarAddon = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { selectedFiles } = useSelectedFiles();
  const { params } = useFileListing('FilesListing');
  const { is_review_project, is_published_project } = useSelector(
    (state) => state.projects.metadata
  );

  const selectedFile = selectedFiles.length === 1 ? selectedFiles[0] : null;

  // TIFF files carry their own dimensions, so no metadata form is needed
  const fileName = selectedFile?.name ?? selectedFile?.path?.split('/').pop() ?? '';
  const isTiff = /\.tiff?$/i.test(fileName);

  const canGenerateImages =
    params.scheme === 'projects' &&
    !!selectedFile &&
    selectedFile.format !== 'folder' &&
    !is_review_project &&
    !is_published_project;

  const getEditFileForm = async () => {
    const response = await fetchUtil({
      url: 'api/forms',
      params: {
        form_name: 'EDIT_FILE',
      },
    });

    return response;
  };

  const { data: form, isLoading } = useQuery({
    queryKey: ['form-edit-file'],
    queryFn: getEditFileForm,
    enabled: isModalOpen && !isTiff,
  });

  const metadata = selectedFile?.metadata ?? {};

  const initialValues = (form?.form_fields ?? []).reduce((acc, field) => {
    let value = '';
    if (field.optgroups) {
      value = field.optgroups[0].options[0]?.value;
    } else {
      value =
        field.options && field.options.length > 0 ? field.options[0].value : '';
    }

    acc[field.name] = metadata[field.name] ?? value;
    return acc;
  }, {});

  const reloadPage = () => {
    history.push(location.pathname);
  };

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const handleSubmit = (values) => {
    Object.keys(values).forEach((key) => {
      values[key] =
        typeof values[key] === 'string' ? values[key].trim() : values[key];
    });

    dispatch({
      type: 'GENERATE_IMAGES',
      payload: {
        projectId: params.system,
        path: selectedFile.path,
        values,
        reloadPage,
      },
    });

    setIsModalOpen(false);
  };

  return (
    <>
      <ToolbarButton
        text="Generate Images"
        iconName="image"
        onClick={() => setIsModalOpen(true)}
        disabled={!canGenerateImages}
        className={styles['generate-images-button']}
      />
      <Modal
        isOpen={isModalOpen}
        toggle={toggleModal}
        size={isTiff ? undefined : 'xl'}
        className="dataFilesModal"
      >
        <ModalHeader toggle={toggleModal}>Generate Images</ModalHeader>
        {isTiff ? (
          <>
            <ModalBody>
              <FormText className="form-field__help" color="muted">
                Generating will create a thumbnail, histogram, and animation for
                this file. Processing runs in the background and may take a few
                minutes. The results will appear alongside the file.
              </FormText>
            </ModalBody>
            <ModalFooter>
              <Button
                attr="button"
                type="primary"
                size="medium"
                onClick={() => handleSubmit({})}
              >
                Generate
              </Button>
            </ModalFooter>
          </>
        ) : isLoading || !form ? (
          <ModalBody>
            <LoadingSpinner />
          </ModalBody>
        ) : (
          <Formik
            initialValues={initialValues}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            <Form>
              <ModalBody>
                <FormText className="form-field__help" color="muted">
                  Enter this file's image properties to generate a
                  thumbnail, histogram, and animation. Processing runs in the
                  background and may take a few minutes. The results will
                  appear alongside the file.
                </FormText>
                <Section
                  className={styles['section']}
                  contentLayoutName="twoColumn"
                  content={
                    <DynamicForm initialFormFields={form.form_fields ?? []} />
                  }
                />
              </ModalBody>
              <ModalFooter>
                <Button attr="submit" type="primary" size="medium">
                  Generate
                </Button>
              </ModalFooter>
            </Form>
          </Formik>
        )}
      </Modal>
    </>
  );
};

export default DataFilesToolbarAddon;
