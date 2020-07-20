export default function getOutputPathFromHref(href) {
  const path = href
    .split('/')
    .slice(7)
    .filter(Boolean)
    .join('/');
  if (path === 'listings') {
    return null;
  }
  return path;
}
