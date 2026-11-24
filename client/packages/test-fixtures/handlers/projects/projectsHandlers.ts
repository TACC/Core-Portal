import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/projects/:systemId/system-role/:username/', () => {
    return HttpResponse.json({ username: 'mmunstermann', role: 'OWNER' });
  }),
];

export const projectsRoleHandlerWithCoPiRole = http.get(
  '/api/projects/:systemId/project-role/:username/',
  () => {
    return HttpResponse.json({ role: 'co_pi' });
  }
);

export const SystemsRoleHandlerWithGuest = http.get(
  '/api/projects/:systemId/system-role/:username/',
  () => {
    return HttpResponse.json({ role: 'GUEST' });
  }
);
