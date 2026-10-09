import { http, HttpResponse } from 'msw';
import workbenchJSON from './workbenchConfig.fixture.json';

export const handlers = [
  http.get('/api/workbench/', () => {
    return HttpResponse.json(workbenchJSON);
  }),
];
