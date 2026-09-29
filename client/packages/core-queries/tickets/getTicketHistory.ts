import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import { TTicketHistoryItem, type TTicketListItem } from './types';

async function getTicketHistory({
  id,
  signal,
}: {
  id: number;
  signal: AbortSignal;
}) {
  const response = await apiClient.get<{
    ticket_history: TTicketHistoryItem[];
  }>(`/api/tickets/${id}/history`, { signal });
  return response.data.ticket_history;
}

export function getTicketHistoryQuery(id: number) {
  return queryOptions({
    queryKey: ['tickets', id, 'history'],
    queryFn: ({ signal }) => getTicketHistory({ id, signal }),
    retry: false,
  });
}
