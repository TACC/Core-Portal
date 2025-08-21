// Format a key to be displayed as a label
// Example: "digital_dataset" -> "Digital Dataset"
export const formatLabel = (key) => {
    // Return as-is if not a string
    if (typeof key !== 'string') {
        return key;
    }
    
    // Handle camelCase by inserting spaces before uppercase letters
    const withSpaces = key.replace(/([a-z])([A-Z])/g, '$1 $2');
    
    // Split by underscores and spaces, then capitalize each word
    return withSpaces
        .split(/[_\s]+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Find a node in a tree structure by UUID
// Returns the node if found, null otherwise
export const findNodeInTree = (node, uuid) => {
    if (node.uuid === uuid) {
        return node;
    }
    if (node.children) {
        for (const child of node.children) {
            const result = findNodeInTree(child, uuid);
            if (result) return result;
        }
    }
    return null;
};