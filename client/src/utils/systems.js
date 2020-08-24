export function getSystemName(host) {
  const systemName = host.split('.')[0];
  return systemName.substring(0, 1).toUpperCase() + systemName.slice(1);
}

export function findSystemDisplayName(systemList, system) {
  const matchingSystem = systemList.find(s => s.system === system);
  if (matchingSystem) {
    return matchingSystem.name;
  }
  return getSystemName(system);
}
