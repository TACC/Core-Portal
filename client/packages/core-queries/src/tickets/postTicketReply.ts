import { mutationOptions } from '@tanstack/react-query';
import { apiClient } from '../apiClient';

async function postTicketReply({
  ticketId,
  formData,
}: {
  ticketId: number;
  formData: FormData;
}) {
  const result = await apiClient.post(
    `/api/tickets/${ticketId}/history`,
    formData
  );
  console.log(result.data);
  return result.data;
}

export function postTicketReplyMutation({ ticketId }: { ticketId: number }) {
  return mutationOptions({
    mutationKey: ['tickets', ticketId],
    mutationFn: (formData: FormData) => postTicketReply({ ticketId, formData }),
  });
}
