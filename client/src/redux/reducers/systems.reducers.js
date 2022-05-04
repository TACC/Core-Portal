export function pushKeys(
  state = {
    target: {},
    modals: {
      pushKeys: false,
    },
    modalProps: {
      pushKeys: {},
    },
  },
  action
) {
  switch (action.type) {
    case 'SET_SYSTEM':
      return {
        ...state,
        target: action.payload.system,
      };
    case 'SYSTEMS_TOGGLE_MODAL':
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
    case 'SYSTEMS_MODAL_UPDATE':
      return {
        ...state,
        modalProps: {
          ...state.modalProps,
          [action.payload.operation]: {
            ...state.modalProps[action.payload.operation],
            ...action.payload.props,
          },
        },
      };
    default:
      return state;
  }
}

export default pushKeys;
