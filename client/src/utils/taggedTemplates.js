// FAQ: Disabling `prefer-default-export` until more functions are added
/* eslint-disable import/prefer-default-export */

/**
 * Create a function that maps values to keys on a pre-provided template literal
 * @param {Array} strings - The strings to join
 * @param  {...any} keys - The values to insert
 * @example
 * // returns "I'm MDN. I'm almost 30 years old."
 * let nameAgeMessage = createTemplate`I'm ${'name'}. I'm almost ${'age'} years old.`;
 * nameAgeMessage({name: 'MDN', age: 30});
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates
 */
export function createTemplateFunction(strings, ...keys) {
  return function joinStringsAndValues(...values) {
    const dict = values[values.length - 1] || {};
    const result = [strings[0]];
    keys.forEach(function insertValueByKey(key, i) {
      const value = Number.isInteger(key) ? values[key] : dict[key];
      result.push(value, strings[i + 1]);
    });
    return result.join('');
  };
}
