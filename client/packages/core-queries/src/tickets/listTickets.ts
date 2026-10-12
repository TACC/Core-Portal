import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import { type TTicketListItem } from './types';

async function listTickets({ signal }: { signal: AbortSignal }) {
  const response = await apiClient.get<{ tickets: TTicketListItem[] }>(
    '/api/tickets',
    { signal }
  );
  return response.data.tickets;
}

export function listTicketsQuery() {
  return queryOptions({
    queryKey: ['tickets'],
    queryFn: ({ signal }) => listTickets({ signal }),
    retry: false,
  });
}
