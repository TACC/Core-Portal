import { mutationOptions } from '@tanstack/react-query';
import { apiClient } from '../apiClient';

async function postTicketCreate({ formData }: { formData: FormData }) {
  const result = await apiClient.post<{ ticket_id: string }>(
    `/api/tickets/`,
    formData
  );
  return result.data.ticket_id;
}

export function postTicketCreateMutation() {
  return mutationOptions({
    mutationKey: ['tickets'],
    mutationFn: (formData: FormData) => postTicketCreate({ formData }),
  });
}
