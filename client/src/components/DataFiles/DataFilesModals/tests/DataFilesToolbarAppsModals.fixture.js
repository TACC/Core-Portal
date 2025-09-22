export const compressAppFixture = {
  id: 'compress-express',
  version: '0.0.1',
  definition: {
    jobAttributes: {
      execSystemId: 'cloud.data.exec',
    },
  },
  execSystems: [
    {
      id: '',
      canRunBatch: false,
      host: 'cloud.data.tacc.utexas.edu',
    }
  ],
};

export const extractAppFixture = {
  definition: {
    jobAttributes: {
      description: 'Extract a tar, tar.gz, tgz, gz, or zip file.',
      dynamicExecSystem: false,
      execSystemConstraints: null,
      execSystemId: 'cloud.data.exec',
    },
  },
  execSystems: [
    {
      id: '',
      canRunBatch: false,
      host: '',
    }
  ],
};

const testFileSize1 = 1.5 * 1024 * 1024 * 1024;
const testFileSize2 = 1 * 1024 * 1024 * 1024;

const DataFilesToolbarAppsModalFixture = {
  files: {
    operationStatus: {
      copy: {},
      compress: {},
      extract: {},
      pushKeys: {},
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
          name: 'testFolder',
          type: 'folder',
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
      compress: true,
      extract: true,
    },
  },
  workbench: {
    config: {
      compressApp: { id: 'compress-express', version: '0.0.1' },
      extractApp: { id: 'extract-express', version: '0.0.1' },
    },
  },
  allocations: {
    portal_alloc: '',
    active: [
      {
        projectName: '',
        systems: [
          {
            allocation: {
              computeAllocated: 10,
              computeUsed: 1.1,
              project: '',
            },
            type: '',
            host: ''
          },
        ],
      },
    ],
  },
  systems: {
    storage: {
      configuration: [
        {
          default: true
        }
      ],
    },
  },
};

export default DataFilesToolbarAppsModalFixture;
