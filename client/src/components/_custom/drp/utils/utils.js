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

// Find a node in a tree structure by UUID
// Returns the node if found, null otherwise
export const findNodeInTree = (node, uuid) => {
    if (node?.uuid === uuid) {
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

export const findNodeInTreeById = (node, id) => {
    const nodeUuid = node?.id?.split('_').pop();
    if (nodeUuid === id) {
        return node;
    }
    if (node.children) {
        for (const child of node.children) {
            const result = findNodeInTreeById(child, id);
            if (result) return result;
        }
    }
    return null;
};

export const getTooltipDescription = (key) => {
    switch (key) {
        case 'sample':
            return 'A sample of a porous material. It can be a core, fibrous material, fuel cell, etc.';
        case 'digital_dataset':
            return 'All images corresponding to the sample, that do not contain any analysis results. One expectation is segmentation, which can be included in the digital dataset.';
        case 'analysis_dataset':
            return 'Analysis datasets are connected to "Sample" entities. They can also be linked to "Digital Dataset" entities if the analysis is conducted on the digital dataset.'
        default:
            return key;
    }
};