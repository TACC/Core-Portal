const DataFilesTrashModalFixture = {
  files: {
    operationStatus: {
      trash: {},
    },
    loadingScroll: {
      FilesListing: false,
      modal: false,
    },
    listing: {
      FilesListing: [
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
              href: 'https://portals-api.tacc.utexas.edu/files/v2/media/system/cep.storage.community//app3.js',
            },
          },
        },
        {
          name: '.agave.log',
          path: '/archive/.agave.log',
          lastModified: '2019-11-14T17:43:36-06:00',
          length: 28,
          permissions: 'READ_WRITE',
          format: 'raw',
          system: 'frontera.home.username',
          mimeType: 'application/octet-stream',
          type: 'file',
          _links: {
            self: {
              href: 'https://portals-api.tacc.utexas.edu/files/v2/media/system/frontera.home.username/archive/.agave.log',
            },
            system: {
              href: 'https://portals-api.tacc.utexas.edu/systems/v2/frontera.home.username',
            },
          },
        },
        {
          name: 'test.txt',
          path: '/test.txt',
          lastModified: '2019-11-14T17:43:36-06:00',
          length: 214,
          permissions: 'READ_WRITE',
          format: 'raw',
          system: 'frontera.home.username',
          mimeType: 'application/octet-stream',
          type: 'file',
          _links: {
            self: {
              href: 'https://portals-api.tacc.utexas.edu/files/v2/media/system/frontera.home.username/test.txt',
            },
            system: {
              href: 'https://portals-api.tacc.utexas.edu/systems/v2/frontera.home.username',
            },
          },
        },
        {
          name: 'pic.png',
          path: '/pic.png',
          lastModified: '2019-11-14T17:43:36-06:00',
          length: 512,
          permissions: 'READ_WRITE',
          format: 'raw',
          system: 'frontera.home.username',
          mimeType: 'application/octet-stream',
          type: 'file',
          _links: {
            self: {
              href: 'https://portals-api.tacc.utexas.edu/files/v2/media/system/frontera.home.username/pic.png',
            },
            system: {
              href: 'https://portals-api.tacc.utexas.edu/systems/v2/frontera.home.username',
            },
          },
        },
      ],
      modal: [],
    },
    params: {
      FilesListing: {
        api: 'tapis',
        scheme: 'private',
        system: 'test.system',
        path: '',
      },
      modal: {},
    },
    selected: {
      FilesListing: [0, 1, 2],
      modal: [],
    },
    modals: {
      pushKeys: false,
      trash: true,
    },
    modalProps: {
      rename: {},
      pushKeys: false,
      trash: {},
    },
  },
};

export default DataFilesTrashModalFixture;
