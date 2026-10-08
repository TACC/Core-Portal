import { delay, http, HttpResponse } from 'msw';
import listTicketsJson from './listTIckets.fixture.json';
import ticketDetailJson from './ticketDetail.fixture.json';
import ticketHistoryJson from './ticketHistory.fixture.json';

export const handlers = [
  http.get('/api/tickets', ({ request }) => {
    return HttpResponse.json(listTicketsJson);
  }),
  http.get('/api/tickets/:id', ({ request }) => {
    return HttpResponse.json(ticketDetailJson);
  }),
  http.get('/api/tickets/:id/history', ({ request }) => {
    return HttpResponse.json(ticketHistoryJson);
  }),
  http.post('/api/tickets/:id/history/', async ({ request }) => {
    await delay(10);
    return HttpResponse.json({});
  }),
  http.post('/api/tickets/', async ({ request }) => {
    await delay();
    return HttpResponse.json({ ticket_id: 1234 });
  }),
];
