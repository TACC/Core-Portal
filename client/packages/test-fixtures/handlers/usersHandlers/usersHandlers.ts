import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users/auth/', () => {
    return HttpResponse.json({
      first_name: 'Max',
      username: 'mmunstermann',
      last_name: 'Munstermann',
      email: 'max@munster.mann',
      oauth: {
        expires_in: 14400,
      },
      groups: [],
      isStaff: false,
    });
  }),

  http.get('/api/users/', ({ request }) => {
    const url = new URL(request.url);
    const queryParam = url.searchParams.get('q');
    if (queryParam === 'sam') {
      return HttpResponse.json([
        {
          first_name: 'Sam',
          username: 'smunstermann',
          last_name: 'Smunstermann',
          email: 'sam@munster.mann',
        },
      ]);
    }
    return HttpResponse.json([]);
  }),
];
