export function getOutputPathFromHref(href) {
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

export function getAllocationFromAppId(appId) {
  /* Return allocation

   App id has the form: prtl.clone.{username}.{allocation} like
   the following: prtl.clone.nathanf.TACC-ACI.namd-frontera-2.1.3-8.0

   */
  const parts = appId.split('.');
  if (appId.startsWith(`prtl.clone.`) && parts.length >= 6) {
    return parts[3];
  }
  return null;
}
