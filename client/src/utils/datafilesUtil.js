export const trimTrailingSlashes = (path) => (path || '').replace(/\/+$/, '');

export const getDecodedPath = (path) => {
  if (!path) return '/';
  try {
    return path.split('/').map(decodeURIComponent).join('/');
  } catch {
    return path;
  }
};
