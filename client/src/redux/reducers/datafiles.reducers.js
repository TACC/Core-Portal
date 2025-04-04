export const initialSystemState = {
  storage: {
    configuration: [],
    error: false,
    errorMessage: null,
    loading: false,
    defaultHost: '',
    defaultSystemId: '',
  },
  definitions: {
    list: [],
    error: {},
    loading: true,
  },
};

export const addSystemDefinition = (system, definitionList) => {
  return [
    ...definitionList.filter((existing) => existing.id !== system.id),
    system,
  ];
};

export function systems(state = initialSystemState, action) {
  switch (action.type) {
    case 'FETCH_SYSTEMS_STARTED':
      return {
        ...state,
        storage: {
          ...state.storage,
          configuration: [],
          error: false,
          errorMessage: null,
          loading: true,
        },
      };
    case 'FETCH_SYSTEMS_SUCCESS':
      return {
        ...state,
        storage: {
          ...state.storage,
          configuration: action.payload.system_list,
          defaultHost: action.payload.default_host,
          defaultSystemId: action.payload.default_system_id,
          loading: false,
        },
      };
    case 'FETCH_SYSTEMS_ERROR':
      return {
        ...state,
        storage: {
          ...state.storage,
          error: true,
          errorMessage: action.payload,
          loading: false,
        },
      };
    case 'FETCH_SYSTEM_DEFINITION_STARTED':
      return {
        ...state,
        definitions: {
          ...state.definitions,
          error: {},
          loading: true,
        },
      };
    case 'FETCH_SYSTEM_DEFINITION_SUCCESS':
      return {
        ...state,
        definitions: {
          ...state.definitions,
          list: addSystemDefinition(action.payload, state.definitions.list),
          error: {},
          loading: false,
        },
      };
    case 'FETCH_SYSTEM_DEFINITION_ERROR':
      return {
        ...state,
        definitions: {
          ...state.definitions,
          error: {
            message: action.payload.message,
            status: action.payload.status,
          },
          loading: false,
        },
      };
    default:
      return state;
  }
}

export const initialFilesState = {
  loading: {
    FilesListing: false,
    modal: false,
  },
  operationStatus: {
    rename: null,
    move: {},
    copy: {},
    select: {},
    upload: {},
    trash: {},
    empty: {},
    compress: {},
    extract: null,
    link: {
      method: null,
      url: '',
      error: null,
      loading: false,
    },
    largeDownload: {},
    noFolders: {},
  },
  loadingScroll: {
    FilesListing: false,
    modal: false,
  },
  error: {
    FilesListing: false,
    modal: false,
    message: '',
  },
  listing: {
    FilesListing: [],
    modal: [],
  },
  params: {
    FilesListing: { api: '', scheme: '', system: '', path: '' },
    modal: { api: '', scheme: '', system: '', path: '' },
  },
  selected: {
    FilesListing: [],
  },
  selectAll: {
    FilesListing: false,
  },
  reachedEnd: {
    FilesListing: true,
    modal: true,
  },
  nextPageToken: {
    FilesListing: null,
    modal: null,
  },
  modals: {
    addproject: false,
    preview: false,
    move: false,
    copy: false,
    select: false,
    upload: false,
    mkdir: false,
    rename: false,
    link: false,
    trash: false,
    empty: false,
    compress: false,
    extract: false,
    manageproject: false,
    editproject: false,
    makePublic: false,
    downloadMessage: false,
    largeDownload: false,
    noFolders: false,
  },
  modalProps: {
    preview: {},
    move: {},
    copy: {},
    select: {},
    upload: {},
    mkdir: {},
    rename: {},
    link: {},
    showpath: {},
    makePublic: {},
    downloadMessage: {},
  },
  refs: {},
  preview: {
    href: null,
    content: null,
    error: null,
    isLoading: true,
  },
};

let selectedSet, enabled, setValue;
export function files(state = initialFilesState, action) {
  switch (action.type) {
    // Cases for fetching a new listing, e.g. on page load.
    case 'FETCH_FILES_START':
      return {
        ...state,
        loading: { ...state.loading, [action.payload.section]: true },
        error: { ...state.error, [action.payload.section]: false },
        listing: { ...state.listing, [action.payload.section]: [] },
        params: {
          ...state.params,
          [action.payload.section]: action.payload.params,
        },
        selected: {
          ...state.selected,
          [action.payload.section]: [],
        },
        selectAll: {
          ...state.selectAll,
          [action.payload.section]: false,
        },
        nextPageToken: {
          ...state.nextPageToken,
          [action.payload.section]: null,
        },
      };
    case 'FETCH_FILES_SUCCESS':
      return {
        ...state,
        loading: { ...state.loading, [action.payload.section]: false },
        error: { ...state.error, [action.payload.section]: false },
        listing: {
          ...state.listing,
          [action.payload.section]: [...action.payload.files],
        },
        reachedEnd: {
          ...state.reachedEnd,
          [action.payload.section]: action.payload.reachedEnd,
        },
        nextPageToken: {
          ...state.nextPageToken,
          [action.payload.section]: action.payload.nextPageToken,
        },
      };
    case 'FETCH_FILES_ERROR':
      return {
        ...state,
        loading: { ...state.loading, [action.payload.section]: false },
        error: {
          ...state.error,
          [action.payload.section]: action.payload.code,
        },
        listing: { ...state.listing, [action.payload.section]: [] },
      };

    // Cases for fetching additional files to append to a listing
    case 'SCROLL_FILES_START':
      return {
        ...state,
        loadingScroll: {
          ...state.loadingScroll,
          [action.payload.section]: true,
        },
        error: { ...state.error, [action.payload.section]: false },
      };
    case 'SCROLL_FILES_SUCCESS':
      return {
        ...state,
        loadingScroll: {
          ...state.loadingScroll,
          [action.payload.section]: false,
        },
        error: { ...state.error, [action.payload.section]: false },
        listing: {
          ...state.listing,
          [action.payload.section]: [
            ...state.listing[action.payload.section],
            ...action.payload.files,
          ],
        },
        reachedEnd: {
          ...state.reachedEnd,
          [action.payload.section]: action.payload.reachedEnd,
        },
        nextPageToken: {
          ...state.nextPageToken,
          [action.payload.section]: action.payload.nextPageToken,
        },
      };
    case 'SCROLL_FILES_ERR':
      return {
        ...state,
        loading: { ...state.loading, [action.payload.section]: false },
        error: { ...state.error, [action.payload.section]: true },
        listing: { ...state.listing, [action.payload.section]: [] },
      };

    // Cases for selecting files.
    case 'DATA_FILES_TOGGLE_SELECT':
      selectedSet = new Set(state.selected[action.payload.section]);
      enabled = state.selected[action.payload.section].includes(
        action.payload.index
      );
      setValue =
        typeof action.payload.set !== 'undefined'
          ? action.payload.set
          : !enabled;
      if (setValue) {
        selectedSet.add(action.payload.index);
      } else {
        selectedSet.delete(action.payload.index);
      }

      return {
        ...state,
        selected: {
          ...state.selected,
          [action.payload.section]: [...selectedSet.values()],
        },
      };
    case 'DATA_FILES_TOGGLE_SELECT_ALL':
      setValue = !state.selectAll[action.payload.section];

      if (setValue) {
        selectedSet = new Set(
          state.listing.FilesListing?.map((f, i) => i) ?? []
        );
      } else {
        selectedSet = new Set([]);
      }

      return {
        ...state,
        selected: {
          ...state.selected,
          [action.payload.section]: [...selectedSet.values()],
        },
        selectAll: {
          ...state.selectAll,
          [action.payload.section]: setValue,
        },
      };
    case 'DATA_FILES_SET_ERROR':
      return {
        ...state,
        error: {
          ...state.error,
          message: action.payload.message,
        },
      };
    case 'DATA_FILES_SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.section]: action.payload.set,
        },
      };
    case 'DATA_FILES_SET_OPERATION_STATUS':
      return {
        ...state,
        operationStatus: {
          ...state.operationStatus,
          [action.payload.operation]: action.payload.status,
        },
      };
    case 'DATA_FILES_SET_OPERATION_STATUS_BY_KEY':
      return {
        ...state,
        operationStatus: {
          ...state.operationStatus,
          [action.payload.operation]: {
            ...state.operationStatus[action.payload.operation],
            [action.payload.key]: action.payload.status,
          },
        },
      };
    case 'DATA_FILES_SET_PREVIEW_CONTENT':
      return {
        ...state,
        preview: {
          ...state.preview,
          ...action.payload,
        },
      };
    case 'DATA_FILES_TOGGLE_MODAL':
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload.operation]: !state.modals[action.payload.operation],
        },
        modalProps: {
          ...state.modalProps,
          [action.payload.operation]: action.payload.props,
        },
      };
    case 'STORE_SELECTOR_REF':
      return {
        ...state,
        refs: {
          ...state.refs,
          FileSelector: action.payload,
        },
      };
    case 'CLEAR_REFS':
      return { ...state, refs: {} };
    case 'DATA_FILES_SET_MODAL_PROPS':
      return {
        ...state,
        modalProps: {
          ...state.modalProps,
          [action.payload.operation]: action.payload.props,
        },
      };
    case 'DATA_FILES_CLEAR_PROJECT_SELECTION':
      return {
        ...state,
        error: {
          ...state.error,
          FilesListing: false,
        },
        params: {
          ...state.params,
          FilesListing: {
            api: 'tapis',
            scheme: 'projects',
            system: '',
            path: '',
          },
        },
      };
    case 'DATA_FILES_CLEAR_FILE_SELECTION':
      return {
        ...state,
        selected: {
          ...state.selected,
          FilesListing: [],
        },
      };
    default:
      return state;
  }
}
