const initialState = {
  categoryDict: {},
  appDict: {},
  appIcons: {},
  error: { isError: false },
  loading: false,
  defaultTab: ''
};

function unpackAppIcons(tabs) {
  const appIcons = {};
  tabs.forEach(tab => {
    tab.apps.forEach(appEntry => {
      if ('icon' in appEntry && appEntry.icon && appEntry.icon.length > 0) {
        appIcons[appEntry.appId] = appEntry.icon;
      }
    });
  });
  return appIcons;
}

function unpackCategoryDict(tabs) {
  const categoryDict = {};
  tabs.forEach(tab => {
    categoryDict[tab.title] = tab.apps;
  });
  return categoryDict;
}

export function apps(state = initialState, action) {
  switch (action.type) {
    case 'GET_APPS_SUCCESS': {
      return {
        ...state,
        categoryDict: unpackCategoryDict(action.payload.tabs),
        appDict: action.payload.definitions,
        appIcons: unpackAppIcons(action.payload.tabs),
        loading: false
      };
    }
    case 'GET_APPS_START':
      return {
        ...state,
        loading: true,
        error: { isError: false }
      };
    case 'GET_APPS_ERROR':
      return {
        ...state,
        error: {
          ...action.payload,
          message: action.payload,
          isError: true
        },
        loading: false
      };
    default:
      return state;
  }
}

export function app(
  state = {
    definition: {},
    error: { isError: false },
    loading: false
  },
  action
) {
  switch (action.type) {
    case 'LOAD_APP':
      return {
        ...state,
        definition: action.payload,
        loading: false
      };
    case 'GET_APP_START':
      return {
        ...state,
        loading: true,
        error: { isError: false },
        definition: {}
      };
    case 'GET_APP_ERROR':
      return {
        ...state,
        error: {
          ...action.payload,
          message: action.payload.message,
          isError: true
        },
        loading: false
      };
    default:
      return state;
  }
}
