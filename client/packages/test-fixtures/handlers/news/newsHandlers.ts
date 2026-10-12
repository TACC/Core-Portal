import { http, HttpResponse } from 'msw';
import newsSanitizedJson from './newsHandlersSanitized.fixture.json';
import newsUnsanitizedJson from './newsHandlersUnsanitized.fixture.json';

export const handlers = [
  http.get('/api/news', ({ request }) => {
    const url = new URL(request.url);
    const sanitizeParam = url.searchParams.get('sanitize');
    if (sanitizeParam === 'true') {
      return HttpResponse.json(newsSanitizedJson);
    }
    return HttpResponse.json(newsUnsanitizedJson);
  }),
];
