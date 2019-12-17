import { combineReducers } from 'redux';


function spinner(state = false, action) {
  switch (action.type) {
    case 'SHOW_SPINNER':
      return true;
    case 'HIDE_SPINNER':
      return false;
    default:
      return state;
  }
};

function jobs(state = [], action) {
  switch(action.type) {
    case 'ADD_JOBS':
      return action.payload;
    case 'FLUSH_JOBS':
      return [];
    default:
      return state;
  }
}

function allocations(state = [], action) {
  switch(action.type) {
    case 'ADD_ALLOCATIONS':
      return action.payload;
    case 'REFRESH_ALLOCATIONS':
      return [];
    default:
      return state;
  }
}

export default combineReducers({ spinner, jobs, allocations });
