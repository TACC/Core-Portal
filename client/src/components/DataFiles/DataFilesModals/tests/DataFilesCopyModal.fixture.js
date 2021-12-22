const DataFilesCopyModalFixture = {
  loading: {
    FilesListing: false,
    modal: false
  },
  operationStatus: {
    copy: {},
    trash: {}
  },
  loadingScroll: {
    FilesListing: false,
    modal: false
  },
  error: {
    FilesListing: false,
    modal: false
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
    ],
    modal: [
      {
        name: 'testfile',
        path: '/testfile',
        lastModified: '2020-07-01T10:12:36-05:00',
        length: 4096,
        permissions: 'ALL',
        format: 'folder',
        system: 'test.system',
        mimeType: 'text/directory',
        type: 'dir',
        isCurrentDirectory: false
      }
    ]
  },
  params: {
    FilesListing: {
      api: 'tapis',
      scheme: 'private',
      system: 'test.system',
      path: ''
    },
    modal: {
      api: 'tapis',
      scheme: 'private',
      system: 'test.system',
      path: ''
    }
  },
  selected: {
    FilesListing: [0],
    modal: []
  },
  selectAll: {
    FilesListing: false,
    modal: false
  },
  reachedEnd: {
    FilesListing: true,
    modal: true
  },
  modals: {
    copy: true
  },
  modalProps: {
    copy: {}
  },
  previewHref: ''
};

export default DataFilesCopyModalFixture;
