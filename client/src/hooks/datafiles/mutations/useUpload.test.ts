import { uploadUtil } from './useUpload';
import { apiClient } from 'utils/apiClient';
import Cookies from 'js-cookie';
import { vi, Mock } from 'vitest';

vi.mock('utils/apiClient');
Cookies.get = vi.fn().mockImplementation(() => 'test-cookie');

describe('uploadUtil', () => {
  const api = 'tapis';
  const scheme = 'private';
  const system = 'apcd.submissions';
  const file = new FormData();
  file.append(
    'uploaded_file',
    new Blob(['test content'], { type: 'text/plain' })
  );

  beforeEach(() => {
    vi.clearAllMocks();
    (Cookies.get as Mock).mockReturnValue('mockCsrfToken');
  });

  it('should construct the correct URL when path is an empty string', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { file: 'mockFile', path: '' },
    });

    await uploadUtil({ api, scheme, system, path: '', file });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/datafiles/tapis/upload/private/apcd.submissions/',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'X-CSRFToken': 'mockCsrfToken' },
        withCredentials: true,
      })
    );
  });

  it('should not call post when path is "/"', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { file: 'mockFile', path: '' },
    });
    await uploadUtil({ api, scheme, system, path: '/', file });
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('should construct the correct URL when path is regular folder', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { file: 'mockFile', path: '/subdir' },
    });

    await uploadUtil({ api, scheme, system, path: 'subdir', file });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/datafiles/tapis/upload/private/apcd.submissions/subdir/',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'X-CSRFToken': 'mockCsrfToken' },
        withCredentials: true,
      })
    );
  });

  it('should normalize multiple slashes in the URL', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { file: 'mockFile', path: '/nested/path' },
    });

    await uploadUtil({ api, scheme, system, path: 'nested//path', file });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/datafiles/tapis/upload/private/apcd.submissions/nested/path/',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'X-CSRFToken': 'mockCsrfToken' },
        withCredentials: true,
      })
    );
  });
});
