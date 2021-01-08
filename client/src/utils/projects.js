/**
 * Returns a capitalized project title.
 *
 * @param {string} projectsList list of projects
 * @param {string} projectSystem the system for the project
 * @return {string} project title
 */

const findProjectTitle = (projectsList, projectSystem) => {
  const matching = projectsList.find(project => project.id === projectSystem);
  if (matching) {
    return matching.description;
  }
  return 'Shared Workspaces';
};

export default findProjectTitle;
