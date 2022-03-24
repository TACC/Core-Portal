const DataFilesDownloadMessageModalFixture = {
  operationStatus: {
    copy: {},
    compress: {},
  },
  listing: {
    FilesListing: {
      name: 'testfile',
      path: '/testfile',
      lastModified: '2020-07-01T10:12:36-05:00',
      length: 4096,
      permissions: 'ALL',
      format: 'folder',
      system: 'test.system',
      mimeType: 'text/directory',
      type: 'dir',
    },
  },
  params: {
    FilesListing: {
      api: 'tapis',
      scheme: 'private',
      system: 'test.system',
      path: '',
    },
  },
  selected: {
    FilesListing: [0],
    modal: [],
  },
  modals: {
    copy: true,
    downloadMessage: true,
  },
};

export default DataFilesDownloadMessageModalFixture;
