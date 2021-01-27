/**
 * Returns a capitalized system name readable message from a job update event.
 *
 * @param {string} host
 * @return {string} system name
 */
export function getSystemName(host) {
  if (
    host.startsWith('data.tacc') ||
    host.startsWith('cloud.corral') ||
    host.startsWith('secure.corral')
  ) {
    return 'Corral';
  }
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
    return '/';
  }
  return getSystemName(system);
}

/**
 * Returns a project title.
 *
 * @param {string} projectsList list of projects
 * @param {string} projectSystem the system for the project
 * @return {string} project title
 */

export function findProjectTitle(projectsList, projectSystem) {
  const matching = projectsList.find(project => project.id === projectSystem);
  if (matching) {
    return matching.description;
  }
  return '';
}

/**
 * Returns display name for system or project
 *
 * @param {string} scheme
 * @param {Array} systemList
 * @param {Array} projectsList
 * @param {string} system
 * @return {string} display name of system or project
 */
export function findSystemOrProjectDisplayName(
  scheme,
  systemList,
  projectsList,
  system
) {
  switch (scheme) {
    case 'projects':
      return findProjectTitle(projectsList, system);
    default:
      return findSystemDisplayName(systemList, system);
  }
}
