import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import { type TTicketListItem } from './types';

async function getTicket({ id, signal }: { id: number; signal: AbortSignal }) {
  const response = await apiClient.get<{ tickets: TTicketListItem[] }>(
    `/api/tickets/${id}`,
    { signal }
  );
  return response.data.tickets[0];
}

export function getTicketQuery(id: number) {
  return queryOptions({
    queryKey: ['tickets', id],
    queryFn: ({ signal }) => getTicket({ id, signal }),
    enabled: !!id,
    retry: false,
  });
}
