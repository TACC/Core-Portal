import { useSuspenseQuery } from '@tanstack/react-query';
import { userQueries } from '@tacc/core-queries';

// This should always be used behind a suspense boundary since we can't render the
// workbench while the user's identity is indeterminate.
export function useAuthenticatedUser() {
  return useSuspenseQuery(userQueries.getAuthenticatedUser()).data;
}

export function useAuthenticatedUserOrThrow() {
  const result = useAuthenticatedUser();
  if (result === null) {
    throw new Error('Authentication is required to view this content.');
  }
  return result;
}
