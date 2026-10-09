// test/example.test.ts
// @vitest-environment node
import { test, expect } from 'vitest';
//import { beforeAll, afterEach, afterAll } from 'vitest'
//import { server } from './server'

//beforeAll(() => server.listen())
//afterEach(() => server.resetHandlers())
//afterAll(() => server.close())

test('responds with the user', async () => {
  const response = await fetch('https://api.example.com/user');

  await expect(response.json()).resolves.toEqual({
    id: 'abc-123',
    firstName: 'John',
    lastName: 'Maverick',
  });
});
