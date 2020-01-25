import { combineReducers } from 'redux';
import { spinner, jobs } from './jobs.reducers';
import { systems, files } from './datafiles.reducers';
import allocations from './allocations.reducers';

export default combineReducers({ spinner, jobs, systems, files, allocations });
