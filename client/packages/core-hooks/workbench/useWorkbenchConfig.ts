import { workbenchConfigQueries } from '@tacc/core-queries';
import { useSuspenseQuery } from '@tanstack/react-query';

// This should always be used behind a suspense boundary since we can't render the
// workbench if the config isn't available.
export const useWorkbenchConfig = () =>
  useSuspenseQuery(workbenchConfigQueries.getWorkbenchConfig());
