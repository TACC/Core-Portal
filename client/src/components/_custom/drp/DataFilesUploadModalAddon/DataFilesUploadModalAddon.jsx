import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { fetchUtil } from 'utils/fetchUtil';
import { DynamicForm } from '_common/Form/DynamicForm';
import { Form, Formik } from 'formik';
import { LoadingSpinner, Section, SectionHeader } from '_common';
import styles from './DataFilesUploadModalAddon.module.scss';


const DataFilesUploadModalAddon = ({ uploadedFiles, setUploadedFiles }) => {


    const [uploadedFilesWithMetadata, setUploadedFilesWithMetadata] = useState([]);

    useEffect(() => {
        setUploadedFilesWithMetadata(uploadedFiles.filter((file) => file.data.name.split('.').pop() === 'raw'));
    }, [uploadedFiles])


    const { data: form, isLoading } = useQuery('form_UPLOAD_FILE', () =>
    fetchUtil({
      url: 'api/forms',
      params: {
        form_name: 'UPLOAD_FILE',
      },
    })
  );

    const handleUploadedFileMetadata = (formFields, values, file) => {
        const updatedFiles = uploadedFiles.map((uploadedFile) => {
            if (uploadedFile.data.name === file.data.name) {
                return {
                    ...uploadedFile,
                    metadata: values
                }
            }
            return uploadedFile;
        });

        setUploadedFiles(updatedFiles);
    }

    return uploadedFilesWithMetadata.length > 0 && (
        <>
          <span className={styles['listing-header']}>Metadata</span>
          <Section
            className={styles['section']}
            contentLayoutName={uploadedFilesWithMetadata.length === 1 ? 'oneColumn' : 'twoColumn'}
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
                        onChange={(formFields, values) => handleUploadedFileMetadata(formFields, values, file)} 
                      />
                    </Form>
                  </Formik>
                )}
              </div>
            ))}
          />
        </>
    );

};

export default DataFilesUploadModalAddon;