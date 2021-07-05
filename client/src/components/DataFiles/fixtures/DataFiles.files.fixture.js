const filesFixture = {
  loading: {
    FilesListing: false,
    modal: false
  },
  operationStatus: {
    rename: null,
    move: {},
    copy: {},
    upload: {},
    trash: {}
  },
  loadingScroll: {
    FilesListing: false,
    modal: false
  },
  error: {
    FilesListing: false,
    modal: []
  },
  listing: {
    FilesListing: [
      {
        name: '.APPDATA',
        path: '/.APPDATA',
        lastModified: '2020-05-19T14:50:40-05:00',
        length: 4096,
        permissions: 'ALL',
        format: 'folder',
        system: 'frontera.home.username',
        mimeType: 'text/directory',
        type: 'dir',
        _links: {
          self: {
            href:
              'https://portals-api.tacc.utexas.edu/files/v2/media/system/cep.storage.community//app0.js'
          }
        }
      },
      {
        name: '.local',
        path: '/.local',
        lastModified: '2020-05-19T18:40:15-05:00',
        length: 4096,
        permissions: 'ALL',
        format: 'folder',
        system: 'frontera.home.username',
        mimeType: 'text/directory',
        type: 'dir',
        _links: {
          self: {
            href:
              'https://portals-api.tacc.utexas.edu/files/v2/media/system/cep.storage.community//app1.js'
          }
        }
      },
      {
        name: '.Trash',
        path: '/.Trash',
        lastModified: '2020-07-01T09:52:47-05:00',
        length: 4096,
        permissions: 'ALL',
        format: 'folder',
        system: 'frontera.home.username',
        mimeType: 'text/directory',
        type: 'dir',
        _links: {
          self: {
            href:
              'https://portals-api.tacc.utexas.edu/files/v2/media/system/cep.storage.community//app2.js'
          }
        }
      },
      {
        name: 'archive',
        path: '/archive',
        lastModified: '2020-07-27T19:37:02-05:00',
        length: 4096,
        permissions: 'ALL',
        format: 'folder',
        system: 'frontera.home.username',
        mimeType: 'text/directory',
        type: 'dir',
        _links: {
          self: {
            href:
              'https://portals-api.tacc.utexas.edu/files/v2/media/system/cep.storage.community//app3.js'
          }
        }
      }
    ],
    modal: []
  },
  params: {
    FilesListing: {
      api: 'tapis',
      scheme: 'private',
      system: 'frontera.home.username',
      path: ''
    },
    modal: {
      api: '',
      scheme: '',
      system: '',
      path: ''
    }
  },
  selected: {
    FilesListing: []
  },
  selectAll: {
    FilesListing: false
  },
  reachedEnd: {
    FilesListing: true,
    modal: true
  },
  modals: {
    preview: false,
    move: false,
    copy: false,
    upload: false,
    mkdir: false,
    rename: false,
    pushKeys: false,
    trash: false
  },
  modalProps: {
    preview: {},
    move: {},
    copy: {},
    upload: {},
    mkdir: {},
    rename: {},
    pushKeys: {},
    showpath: {},
    makePublic: {},
    select: {}
  },
  preview: {
    href: '',
    content: ''
  }
};

export default filesFixture;
