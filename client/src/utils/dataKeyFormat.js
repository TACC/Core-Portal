/**
 * Function to format the data_type value from snake_case to Label Case i.e. project_title -> Project Title
 * @param {String} key
 */
export function formatDataKey(key) {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
