/**
 * Returns a capitalized system name readable message from a job update event.
 *
 * @param {string} host
 * @return {string} system name
 */
export function getSystemName(host) {
  const systemName = host.split('.')[0];
  return systemName.substring(0, 1).toUpperCase() + systemName.slice(1);
}

/**
 * Returns display name for system
 *
 * @param {Array} list of systems
 * @param {string} system
 * @return {string} display name of system
 */
export function findSystemDisplayName(systemList, system, isRoot) {
  const matchingSystem = systemList.find(s => s.system === system);
  if (matchingSystem) {
    return matchingSystem.name;
  }
  if (isRoot) {
    return '/'
  }
  return getSystemName(system);
}
