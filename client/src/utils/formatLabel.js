// Format a key to be displayed as a label
// Example: "digital_dataset" -> "Digital Dataset"
export const formatLabel = (key) => {
  // Return as-is if not a string
  if (typeof key !== 'string') {
    return key;
  }

  // Check if it's a valid URL
  const isValidUrl = (str) => {
    try {
      const url = new URL(str);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  if (isValidUrl(key)) {
    return key;
  }

  // Handle camelCase by inserting spaces before uppercase letters
  const withSpaces = key.replace(/([a-z])([A-Z])/g, '$1 $2');

  // Split by underscores and spaces, then capitalize each word
  return withSpaces
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace('Uri', 'URI'); // Fix for URI
};

export default formatLabel;
