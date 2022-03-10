const DataFilesShowPathModalFixture = {
  params: {
    FilesListing: {
      api: 'tapis',
      scheme: 'private',
      system: 'frontera.home.username',
      path: '',
    },
    modal: {
      api: 'tapis',
      scheme: 'private',
      system: 'frontera.home.username',
      path: '',
    },
  },
  listing: {
    FilesListing: [
      {
        name: 'testfile',
        path: '/testfile',
        lastModified: '2020-07-01T10:12:36-05:00',
        length: 4096,
        permissions: 'ALL',
        format: 'folder',
        system: 'test.system',
        mimeType: 'text/directory',
        type: 'dir'
      }
    ]
  },
  modalProps: {
    showpath: {
      file: {
        name: 'testfile',
        path: '/testfile',
        lastModified: '2020-07-01T10:12:36-05:00',
        length: 4096,
        permissions: 'ALL',
        format: 'folder',
        system: 'frontera.home.username',
        mimeType: 'text/directory',
        type: 'dir',
      },
    },
  },
  modals: {
    showpath: true,
  },
};

export default DataFilesShowPathModalFixture;
