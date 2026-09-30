import { getTicketQuery } from './getTicket';
import { getTicketHistoryQuery } from './getTicketHistory';
import { listTicketsQuery } from './listTickets';
import { postTicketCreateMutation } from './postTicketCreate';
import { postTicketReplyMutation } from './postTicketReply';

export const ticketsQueries = {
  listTickets: listTicketsQuery,
  getTicket: getTicketQuery,
  getTicketHistory: getTicketHistoryQuery,
};

export const ticketsMutations = {
  postTicketReply: postTicketReplyMutation,
  postTicketCreate: postTicketCreateMutation,
};
