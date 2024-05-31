import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUtil } from 'utils/fetchUtil';

const useDrpDatasetModals = (projectId, portalName, useReloadCallback = true) => {
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

    return response;
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
                ...sample.metadata,
                value: parseInt(sample.id),
                label: sample.name,
              };
            })
          );
        }
      });

      dispatch({
        type: 'DATA_FILES_TOGGLE_MODAL',
        payload: {
          operation: 'dynamicform',
          props: { selectedFile, form, formName, additionalData: { samples }, useReloadCallback },
        },
      });
    }
  );

  const createAnalysisDataModal = useCallback(
    async (formName, selectedFile = null) => {
      const form = await getFormFields(formName);
      const { samples, origin_data: originDatasets } = await getDatasets(
        projectId,
        portalName,
        true
      );

      form.form_fields.map((field) => {
        if (field.name === 'sample') {
          field.options.push(
            ...samples.map((sample) => {
              return {
                value: parseInt(sample.id),
                label: sample.name,
              };
            })
          );
        } else if (field.name === 'base_origin_data') {
          field.options.push(
            ...originDatasets.map((originData) => {
              return {
                value: parseInt(originData.id),
                label: originData.name,
                dependentId: parseInt(originData.metadata.sample),
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
            additionalData: { samples, originDatasets },
            useReloadCallback
          },
        },
      });
    }
  );

  return { createSampleModal, createOriginDataModal, createAnalysisDataModal };
};

export default useDrpDatasetModals;
