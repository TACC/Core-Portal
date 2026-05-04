import { vi } from 'vitest';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from 'utils/apiClient';
import useUserNews, { fetchUserNewsUtil } from './useUserNews';

vi.mock('@tanstack/react-query');
vi.mock('utils/apiClient');

describe('fetchUserNewsUtil', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls /api/news/ with sanitize false by default', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { response: [{ id: 1 }], status: 200 },
    });

    const data = await fetchUserNewsUtil();

    expect(apiClient.get).toHaveBeenCalledWith('/api/news/', {
      params: { sanitize: false },
    });
    expect(data).toEqual([{ id: 1 }]);
  });

  it('calls /api/news/ with sanitize true when requested', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { response: [{ id: 2 }], status: 200 },
    });

    const data = await fetchUserNewsUtil({ sanitize: true });

    expect(apiClient.get).toHaveBeenCalledWith('/api/news/', {
      params: { sanitize: true },
    });
    expect(data).toEqual([{ id: 2 }]);
  });
});

describe('useUserNews', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('uses sanitize false by default and returns the useQuery result', () => {
    const queryResult = {
      data: undefined,
      isPending: false,
      isError: false,
      status: 'success',
    };
    vi.mocked(useQuery).mockReturnValue(queryResult as never);

    const result = useUserNews();

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['userNews', false],
      })
    );
    expect(result).toBe(queryResult);
  });

  it('uses sanitize true and wires queryFn to fetch util', () => {
    const queryResult = {
      data: [{ id: 3 }],
      isPending: false,
      isError: false,
      status: 'success',
    };
    vi.mocked(useQuery).mockReturnValue(queryResult as never);

    const result = useUserNews({ sanitize: true });

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['userNews', true],
        queryFn: expect.any(Function),
      })
    );
    expect(result).toBe(queryResult);
  });
});
