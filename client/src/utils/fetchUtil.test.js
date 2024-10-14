import { fetchUtil, FetchError } from './fetchUtil';
import Cookies from 'js-cookie';
import { vi } from 'vitest';

global.fetch = vi.fn();
Cookies.get = vi.fn().mockImplementation(() => 'test-cookie');

describe('fetchUtil', () => {
  afterEach(() => {
    fetch.mockClear();
  });

  test('Fetches data from the back-end', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ hello: 'world' }),
    });

    const req = new URL('/api/test', 'http://localhost:3000');
    req.searchParams.append('search', 'params');

    const json = await fetchUtil({
      url: 'http://localhost:3000/api/test',
      params: { search: 'params' },
      method: 'POST',
      body: JSON.stringify({}),
    });

    expect(fetch).toHaveBeenCalledWith(req, {
      body: JSON.stringify({}),
      credentials: 'same-origin',
      headers: {
        'X-CSRFToken': Cookies.get('csrf'),
      },
      method: 'POST',
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(json).toEqual({ hello: 'world' });
  });

  test('throws error', async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: "Didn't work" }),
    });
    try {
      await fetchUtil({ url: '/api/test' });
    } catch (error) {
      expect(error).toBeInstanceOf(FetchError);
      expect(error.message).toBe("Didn't work");
    }
  });
});
