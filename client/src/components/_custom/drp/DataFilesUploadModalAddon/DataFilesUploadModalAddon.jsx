import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUtil } from 'utils/fetchUtil';
import { DynamicForm } from '_common/Form/DynamicForm';
import { Form, Formik } from 'formik';
import { LoadingSpinner, Section, SectionHeader } from '_common';
import styles from './DataFilesUploadModalAddon.module.scss';

const DataFilesUploadModalAddon = ({ uploadedFiles, setUploadedFiles }) => {
  const [uploadedFilesWithMetadata, setUploadedFilesWithMetadata] = useState(
    []
  );

  // regex from old digitalrocks portal
  const standardImageType = /(\.|\/)(gif|jpe?g|png|tiff?)$/i;

  useEffect(() => {
    // if the uploaded files don't have basic metadata, add metadata
    if (!uploadedFiles.every((file) => file.metadata)) {
      setUploadedFiles(
        uploadedFiles.map((file) => {
          return { ...file, metadata: { data_type: 'file' } };
        })
      );
    }

    setUploadedFilesWithMetadata(
      uploadedFiles.filter((file) => file.is_advanced_image_file)
    );
  }, [uploadedFiles]);

  const useUploadFileForm = () => {
    return useQuery({
      queryKey: ['form-upload-file'],
      queryFn: async () =>
        fetchUtil({
          url: 'api/forms',
          params: { form_name: 'UPLOAD_FILE' },
        }),
    });
  };

  const { data: form, isLoading } = useUploadFileForm();

  const handleUploadedFileMetadata = (formFields, values, file) => {
    const updatedFiles = uploadedFiles.map((uploadedFile) => {
      if (uploadedFile.data.name === file.data.name) {
        return {
          ...uploadedFile,
          metadata: { 
            name: uploadedFile.data.name,
            is_advanced_image_file: uploadedFile.is_advanced_image_file,
            ...values },
        };
      }
      return uploadedFile;
    });

    setUploadedFiles(updatedFiles);
  };

  return (
    uploadedFilesWithMetadata.length > 0 && (
      <>
        <span className={styles['listing-header']}>Metadata</span>
        <Section
          className={styles['section']}
          contentLayoutName={
            uploadedFilesWithMetadata.length === 1 ? 'oneColumn' : 'twoColumn'
          }
          content={uploadedFilesWithMetadata.map((file) => (
            <div key={file.data.name}>
              {isLoading ? (
                <p>Loading form...</p>
              ) : (
                <Formik initialValues={{}}>
                  <Form>
                    <SectionHeader>{file.data.name}</SectionHeader>
                    <DynamicForm
                      initialFormFields={form?.form_fields ?? []}
                      onChange={(formFields, values) =>
                        handleUploadedFileMetadata(formFields, values, file)
                      }
                    />
                  </Form>
                </Formik>
              )}
            </div>
          ))}
        />
      </>
    )
  );
};

export default DataFilesUploadModalAddon;
