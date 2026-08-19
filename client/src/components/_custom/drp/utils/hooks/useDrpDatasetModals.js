import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUtil } from 'utils/fetchUtil';
import { fetchForm } from 'hooks/datafiles';

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

const useDrpDatasetModals = (
  projectId,
  portalName,
  useReloadCallback = true
) => {
  const dispatch = useDispatch();

  const folderData = useSelector(
    (state) => state.files.folderMetadata.FilesListing
  );
  let sampleUUID = '';
  if (folderData && folderData.data_type === 'sample') {
    sampleUUID = folderData.uuid;
  } else if (
    folderData &&
    (folderData.data_type === 'digital_dataset' ||
      folderData.data_type === 'analysis_data')
  ) {
    sampleUUID = folderData.sample;
  }

  const openDynamicFormModal = useCallback(
    ({ form, selectedFile = null, formName, additionalData }) => {
      dispatch({
        type: 'DATA_FILES_TOGGLE_MODAL',
        payload: {
          operation: 'dynamicform',
          props: {
            form,
            selectedFile,
            formName,
            ...(additionalData && { additionalData }),
            useReloadCallback,
          },
        },
      });
    },
    [dispatch, useReloadCallback]
  );

  const createSampleModal = useCallback(
    async (formName, selectedFile = null) => {
      const form = await fetchForm(formName);
      openDynamicFormModal({ form, selectedFile, formName });
    },
    [openDynamicFormModal]
  );

  const createOriginDataModal = useCallback(
    async (formName, selectedFile = null) => {
      const form = await fetchForm(formName);
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
          field.defaultValue = sampleUUID;
        }
      });

      openDynamicFormModal({
        form,
        selectedFile,
        formName,
        additionalData: { samples },
      });
    },
    [openDynamicFormModal, projectId, portalName, sampleUUID]
  );

  const createAnalysisDataModal = useCallback(
    async (formName, selectedFile = null) => {
      const form = await fetchForm(formName);
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
                value: sample.uuid,
                label: sample.value.name,
              };
            })
          );
          field.defaultValue = sampleUUID;
        } else if (field.name === 'digital_dataset') {
          field.options.push(
            ...originDatasets.map((originData) => {
              return {
                value: originData.uuid,
                label: originData.value.name,
                dependentId: originData.value.sample,
              };
            }),
            { value: 'other', label: 'Other (Specify Below)' }
          );
        }
      });

      openDynamicFormModal({
        form,
        selectedFile,
        formName,
        additionalData: { samples, originDatasets },
      });
    },
    [openDynamicFormModal, projectId, portalName, sampleUUID]
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
