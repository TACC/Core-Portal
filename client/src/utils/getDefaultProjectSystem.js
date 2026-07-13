
export default function getDefaultProjectSystem(configuration = []) {
  const projectSystems = configuration.filter((s) => s.scheme === 'projects');
  if (projectSystems.length <= 1) {
    return projectSystems[0];
  }
  return projectSystems.find((s) => s.defaultProject) ?? projectSystems[0];
}
