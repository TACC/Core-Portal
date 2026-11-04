import { getAuthenticatedUserQuery } from './getAuthenticatedUser';
import { getUserSearchQuery } from './getUserSearch';

export const userQueries = {
  getAuthenticatedUser: getAuthenticatedUserQuery,
  getUserSearch: getUserSearchQuery,
};
