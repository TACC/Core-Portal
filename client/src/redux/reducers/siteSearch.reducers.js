const initialState = {
  loading: false,
  error: null,
  completed: false,
  results: {
    cms: { count: 0, listing: [], type: 'cms', include: true },
    community: { count: 0, listing: [], type: 'file', include: false },
    public: { count: 0, listing: [], type: 'file', include: false },
  },
};

const siteSearch = (state = initialState, action) => {
  switch (action.type) {
    case 'FETCH_SITE_SEARCH_START':
      return { ...state, loading: true, error: null, completed: false };
    case 'FETCH_SITE_SEARCH_ERROR':
      return {
        ...state,
        error: action.payload.error,
        completed: true,
        loading: false,
      };
    case 'FETCH_SITE_SEARCH_SUCCESS':
      return {
        ...state,
        loading: false,
        error: null,
        completed: true,
        results: { ...state.results, ...action.payload.results },
      };
    default:
      return state;
  }
};

export default siteSearch;
