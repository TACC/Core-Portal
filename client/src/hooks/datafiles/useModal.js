import { useDispatch, useSelector } from 'react-redux';

function useModal() {
  const dispatch = useDispatch();

  const getStatus = (operation) => {
    return useSelector((state) => state.files.modals[operation]);
  };

  const getProps = (operation) => {
    return useSelector((state) => state.files.modalProps[operation]);
  };

  const setProps = ({ operation, props }) => {
    dispatch({
      type: 'DATA_FILES_SET_MODAL_PROPS',
      payload: {
        operation,
        props,
      },
    });
  };

  const toggle = ({ operation, props }) => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: { operation, props },
    });
  };

  return { toggle, getStatus, getProps, setProps };
}

export default useModal;
