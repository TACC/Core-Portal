import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { newsHandlers } from './handlers/news';
import { ticketsHandlers } from './handlers/tickets';
import { usersHandlers } from './handlers/usersHandlers';
import { workbenchHandlers } from './handlers/workbench';

const exampleHandler = [
  http.get('https://api.example.com/user', () => {
    return HttpResponse.json({
      id: 'abc-123',
      firstName: 'John',
      lastName: 'Maverick',
    });
  }),
];
export const server = setupServer(
  ...newsHandlers,
  ...ticketsHandlers,
  ...workbenchHandlers,
  ...usersHandlers,
  ...exampleHandler
);
