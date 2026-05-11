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
    new File(['test content'], 'testfile.txt', { type: 'text/plain' })
  );

  const mockTapisToken = {
    token: 'mockToken',
    baseUrl: 'https://mock-tapis-api.com',
    tapisTrackingId: 'portals.mockSessionKeyHash',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (Cookies.get as Mock).mockReturnValue('mockCsrfToken');
  });

  it('should construct the correct URL when path is an empty string', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { file: 'mockFile', path: '' },
    });

    await uploadUtil({
      api,
      scheme,
      system,
      path: '',
      file,
      tapisToken: mockTapisToken,
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      'https://mock-tapis-api.com/v3/files/ops/apcd.submissions/testfile.txt',
      expect.any(FormData),
      expect.objectContaining({
        headers: {
          'X-Tapis-Token': mockTapisToken.token,
          'X-Tapis-Tracking-ID': mockTapisToken.tapisTrackingId,
          'content-type': 'multipart/form-data',
        },
      })
    );
  });

  it('should call post when path is "/"', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { file: 'mockFile', path: '' },
    });
    await uploadUtil({
      api,
      scheme,
      system,
      path: '/',
      file,
      tapisToken: mockTapisToken,
    });
    expect(apiClient.post).toHaveBeenCalled();
  });

  it('should construct the correct URL when path is regular folder', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { file: 'mockFile', path: '/subdir' },
    });

    await uploadUtil({
      api,
      scheme,
      system,
      path: 'subdir',
      file,
      tapisToken: mockTapisToken,
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      'https://mock-tapis-api.com/v3/files/ops/apcd.submissions/subdir/testfile.txt',
      expect.any(FormData),
      expect.objectContaining({
        headers: {
          'X-Tapis-Token': mockTapisToken.token,
          'X-Tapis-Tracking-ID': mockTapisToken.tapisTrackingId,
          'content-type': 'multipart/form-data',
        },
      })
    );
  });

  it('should normalize multiple slashes in the URL', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { file: 'mockFile', path: '/nested/path' },
    });

    await uploadUtil({
      api,
      scheme,
      system,
      path: 'nested//path',
      file,
      tapisToken: mockTapisToken,
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      'https://mock-tapis-api.com/v3/files/ops/apcd.submissions/nested/path/testfile.txt',
      expect.any(FormData),
      expect.objectContaining({
        headers: {
          'X-Tapis-Token': mockTapisToken.token,
          'X-Tapis-Tracking-ID': mockTapisToken.tapisTrackingId,
          'content-type': 'multipart/form-data',
        },
      })
    );
  });
});
