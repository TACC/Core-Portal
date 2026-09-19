// Find a node in a project metadata tree by UUID.
// Returns the node if found, null otherwise.
export const findNodeInTree = (node, uuid) => {
  // upon refresh, node is null so returning null
  if (node === null) {
    return null;
  }

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

// Find a node in a project metadata tree by the id suffix (node.id -> trailing segment).
// Returns the node if found, null otherwise.
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
