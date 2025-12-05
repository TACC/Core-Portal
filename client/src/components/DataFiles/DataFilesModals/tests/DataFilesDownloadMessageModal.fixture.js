const testFileSize1 = 1.5 * 1024 * 1024 * 1024;
const testFileSize2 = 1 * 1024 * 1024 * 1024;

const DataFilesDownloadMessageModalFixture = {
  files: {
    operationStatus: {
      copy: {},
      compress: {},
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
          type: 'dir',
        },
        {
          name: 'test1.txt',
          type: 'file',
          length: testFileSize1,
          path: '/test1.txt',
          id: 123,
        },
        {
          name: 'test2.txt',
          type: 'file',
          length: testFileSize1,
          path: '/test2.txt',
          id: 456,
        },
        {
          name: 'test3.txt',
          type: 'file',
          length: testFileSize2,
          path: '/test3.txt',
          id: 234,
        },
        {
          name: 'test4.txt',
          type: 'file',
          length: 500,
          path: '/test4.txt',
          id: 234,
        },
        {
          name: 'testFolder',
          format: 'folder',
          type: 'dir',
          path: '/testFolder',
          id: 789,
        },
      ],
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
  },
  workbench: {
    config: {
      compressApp: { id: 'compress', version: '0.0.4' },
    },
  },
  allocations: {
    portal_alloc: '',
    active: [
      {
        systems: [
          {
            allocation: {
              computeAllocated: 10,
              computeUsed: 1.1,
              project: '',
            },
            type: '',
          },
        ],
      },
    ],
  },
  systems: {
    storage: {
      configuration: [],
    },
  },
};

export default DataFilesDownloadMessageModalFixture;
