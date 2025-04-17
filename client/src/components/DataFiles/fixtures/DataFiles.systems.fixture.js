/* TODOv3 update this fixture https://jira.tacc.utexas.edu/browse/WP-68*/
// Updated fixture changes from endpoint https://cep.test/api/datafiles/systems/list/
// Removed from configuration: hidden, keyservice
// Removed from storage and defintions array: errorMessage, loading
const systemsFixture = {
  storage: {
    configuration: [
      {
        name: 'My Data (Work)',
        system: 'corral.home.username',
        scheme: 'private',
        api: 'tapis',
        icon: null,
        homeDir: '/home/username',
        default: true,
      },
      {
        name: 'My Data (Frontera)',
        system: 'frontera.home.username',
        scheme: 'private',
        api: 'tapis',
        icon: null,
        homeDir: '/home/username',
      },
      {
        name: 'My Data (Longhorn)',
        system: 'longhorn.home.username',
        scheme: 'private',
        api: 'tapis',
        icon: null,
        homeDir: '/home/username',
      },
      {
        name: 'Community Data',
        system: 'cep.storage.community',
        scheme: 'community',
        api: 'tapis',
        icon: null,
        siteSearchPriority: 1,
        homeDir: '/corral/tacc/aci/CEP/community',
      },
      {
        name: 'Public Data',
        system: 'cep.storage.public',
        scheme: 'public',
        api: 'tapis',
        icon: 'publications',
        siteSearchPriority: 0,
        homeDir: '/corral/tacc/aci/CEP/public',
      },
      {
        name: 'Shared Workspaces',
        scheme: 'projects',
        api: 'tapis',
        icon: null,
        readOnly: false,
        hideSearchBar: false,
      },
      {
        name: 'Google Drive',
        system: 'googledrive',
        scheme: 'private',
        api: 'googledrive',
        icon: null,
        integration: 'portal.apps.googledrive_integration',
      },
    ],
    /*
     * The following needs to be mirrored for the storage and definitions

    These are included in the datafiles reducers but pass tests without these
    This means that tests need to be more comprehensive to catch this or removed

    Definitions that use variables other than list are used in:
    - DataFilesTable.jsx:45 for error

    state.systems.definitions.* is not called for anything else other than error
    These would need to be removed then
    - errorMessage
    - loading
    */

    //error: false,
    //errorMessage: null,
    //loading: false,
    defaultHost: 'frontera.tacc.utexas.edu',
    defaultSystemId: 'frontera',
  },
  // This definitions is required for the tests, some can be removed. Referencing datafiles.reducers.js
  definitions: {
    // For DataFilesTable and DataFilesShowPathModal it requires the id from this list
    list: [
      {
        id: 'frontera.home.username',
        storage: {
          host: 'frontera.tacc.utexas.edu',
          rootDir: '/home1/012345/username',
        },
        effectiveUserId: 'username',
      },
      {
        id: 'longhorn.home.username',
        storage: {
          host: 'longhorn.tacc.utexas.edu',
          rootDir: '/home/012345/username',
        },
        effectiveUserId: 'username',
      },
    ],
    error: false, // Commenting this out results in an error
    //errorMessage: null,
    //loading: false,
  },
};

export default systemsFixture;
