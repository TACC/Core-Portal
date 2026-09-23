import { setupServer } from 'msw/node';
import { newsHandlers } from './handlers/news';

import { http, HttpResponse } from 'msw';
const exampleHandler = [
  http.get('https://api.example.com/user', () => {
    return HttpResponse.json({
      id: 'abc-123',
      firstName: 'John',
      lastName: 'Maverick',
    });
  }),
];
export const server = setupServer(...newsHandlers, ...exampleHandler);
