/**
 * Checks that the field is a non-empty string
 * @param {Object} props -
 * @param {String} propName - name of the property
 * @param {String} componentName - name of the component
 * @returns {String} Message if error, otherwise null
 */

export default function emptyStringValidator(props, propName, componentName) {
  if (
    !props[propName] ||
    (typeof props[propName] !== 'string') ||
    props[propName].replace(/ /g, '') === ''
  ) {
    return new Error(
      `No text passed to <${componentName}> prop "${propName}". Validation failed.`
    );
  }
}
