import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserNews } from './useUserNews';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';

const queryClient = new QueryClient();
const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useUserNews', () => {
  it('returns sanitized content when sanitize=true is passed', async () => {
    const { result } = renderHook(() => useUserNews({ sanitize: true }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBeGreaterThanOrEqual(1);
    expect(result.current.data?.[0].author).toBeDefined();
  });

  it('returns unsanitized content when no argument is passed', async () => {
    const { result } = renderHook(() => useUserNews(), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBeGreaterThanOrEqual(1);
    expect(result.current.data?.[0].author).toBeDefined();
    expect(result.current.data?.[0].content).toContain('&nbsp;');
  });
});
