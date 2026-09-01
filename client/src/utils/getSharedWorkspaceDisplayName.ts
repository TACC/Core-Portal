const getSharedWorkspaceDisplayName = (name?: string): string | undefined =>
  name && name.endsWith('s') ? name.slice(0, -1) : name;

export default getSharedWorkspaceDisplayName;
