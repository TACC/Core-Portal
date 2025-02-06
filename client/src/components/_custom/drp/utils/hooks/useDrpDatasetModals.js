import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUtil } from 'utils/fetchUtil';

const useDrpDatasetModals = (
  projectId,
  portalName,
  useReloadCallback = true
) => {
  const getFormFields = async (formName) => {
    const response = await fetchUtil({
      url: 'api/forms',
      params: {
        form_name: formName,
      },
    });
    return response;
  };

  const getDatasets = async (projectId, portalName, getOriginData = false) => {
    const response = await fetchUtil({
      url: `api/${portalName.toLowerCase()}`,
      params: {
        project_id: projectId,
        get_origin_data: getOriginData,
      },
    });

  const projectsResponse = await fetchUtil({
    url: 'api/projects',
  });

  return { ...response, projects: projectsResponse };
  };

  const dispatch = useDispatch();

  const createSampleModal = useCallback(
    async (formName, selectedFile = null) => {
      const form = await getFormFields(formName);

      dispatch({
        type: 'DATA_FILES_TOGGLE_MODAL',
        payload: {
          operation: 'dynamicform',
          props: { form, selectedFile, formName, useReloadCallback },
        },
      });
    },
    [dispatch]
  );

  const createOriginDataModal = useCallback(
    async (formName, selectedFile = null) => {
      const form = await getFormFields(formName);
      const { samples } = await getDatasets(projectId, portalName);

      form.form_fields.map((field) => {
        if (field.name === 'sample') {
          field.options.push(
            ...samples.map((sample) => {
              return {
                ...sample.value,
                value: sample.uuid,
                label: sample.value.name,
              };
            })
          );
        }
      });

      dispatch({
        type: 'DATA_FILES_TOGGLE_MODAL',
        payload: {
          operation: 'dynamicform',
          props: {
            selectedFile,
            form,
            formName,
            additionalData: { samples },
            useReloadCallback,
          },
        },
      });
    }
  );

  const createAnalysisDataModal = useCallback(
    async (formName, selectedFile = null) => {
      const form = await getFormFields(formName);
  
      const { samples, origin_data: originDatasets, projects } = await getDatasets(
        projectId,
        portalName,
        true
      );
    
      const projectOptions = [
        { value: '', label: '' },
        ...projects.response.map((project) => ({
          value: project.id, 
          label: project.title 
        })),
        { value: 'other', label: 'Other (Specify Below)' }
      ];
    
      form.form_fields.map((field) => {
        if (field.name === 'sample') {
          field.options.push(
            ...samples.map((sample) => ({
              value: sample.uuid,
              label: sample.value.name,
            }))
          );
        }
        else if (field.name === 'digital_dataset') {
          field.options = projectOptions; 
        }
      });

      const datasetFieldIndex = form.form_fields.findIndex(field => field.name === 'digital_dataset');

      if (datasetFieldIndex !== -1) {
        form.form_fields.splice(datasetFieldIndex + 1, 0, {
          name: 'digital_dataset_other',
          label: 'Please specify the project',
          type: 'text',
          hidden: true, 
          validation: { required: true },
          dependency: { name: 'digital_dataset', type: 'visibility', value: 'other' }, 
        });
      }
    
      dispatch({
        type: 'DATA_FILES_TOGGLE_MODAL',
        payload: {
          operation: 'dynamicform',
          props: {
            selectedFile,
            form,
            formName,
            additionalData: { samples, originDatasets, projects },
            useReloadCallback,
          },
        },
      });
    }
  );

  const createTreeModal = useCallback(
    async ({ readOnly = false }) => {
      dispatch({
        type: 'DATA_FILES_TOGGLE_MODAL',
        payload: {
          operation: 'projectTree',
          props: { readOnly },
        },
      });
    },
    [dispatch]
  );

  const createPublicationAuthorsModal = useCallback(
    async ({ authors }) => {
      dispatch({
        type: 'DATA_FILES_TOGGLE_MODAL',
        payload: {
          operation: 'publicationAuthors',
          props: { authors },
        },
      });
    },
    [dispatch]
  );

  return {
    createSampleModal,
    createOriginDataModal,
    createAnalysisDataModal,
    createTreeModal,
    createPublicationAuthorsModal,
  };
};

export default useDrpDatasetModals;
