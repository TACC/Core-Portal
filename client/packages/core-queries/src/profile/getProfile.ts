import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import { TProfileResponse } from './types';

async function getProfile() {
  const result = await apiClient.get<TProfileResponse>(
    '/accounts/api/profile/data'
  );
  return result.data;
}

export function getProfileQuery() {
  return queryOptions({ queryKey: ['profile'], queryFn: () => getProfile() });
}
