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
];
