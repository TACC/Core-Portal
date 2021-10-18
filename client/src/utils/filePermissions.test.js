import getFilePermissions from './filePermissions';

const privateFixture = {
  files: [
    {
      name: 'test.tar.gz',
      path: '/test/test.tar.gz',
      lastModified: '2020-08-01T00:00:00-05:00',
      system: 'frontera.home.test',
      type: 'file',
    },
  ],
  scheme: 'private',
  api: 'tapis',
};
const publicFixture = {
  files: [
    {
      name: 'test.txt',
      path: '/test/test.txt',
      lastModified: '2020-08-01T00:00:00-05:00',
      system: 'frontera.home.test',
      type: 'file',
    },
  ],
  scheme: 'public',
  api: 'tapis',
};
const multipleFilesFixture = {
  files: [
    {
      name: 'text.txt',
      path: '/test/text.txt',
      lastModified: '2020-08-01T00:00:00-05:00',
      system: 'frontera.home.test',
      type: 'file',
    },
    {
      name: 'text2.txt',
      path: '/test/text2.txt',
      lastModified: '2020-08-01T00:00:00-05:00',
      system: 'frontera.home.test',
      type: 'file',
    },
  ],
  scheme: 'private',
  api: 'tapis',
}
describe('getFilePermissions utility function', () => {
  it.each([
    'rename',
    'download',
    'extract',
    'move',
    'copy',
    'trash',
    'compress',
    'areMultipleFilesOrFolderSelected'
  ])('Correctly evaluate %s permission', (pem) => {
    if (!['compress', 'areMultipleFilesOrFolderSelected'].includes(pem)) {
      expect(getFilePermissions(pem, privateFixture)).toEqual(true);
    } else {
      expect(getFilePermissions(pem, privateFixture)).toEqual(false);
    }
    if (['copy', 'download'].includes(pem)) {
      expect(getFilePermissions(pem, publicFixture)).toEqual(true);
    } else {
      expect(getFilePermissions(pem, publicFixture)).toEqual(false);
    }
    if (['areMultipleFilesOrFolderSelected', 'compress', 'copy', 'move', 'trash'].includes(pem)) {
      expect(getFilePermissions(pem, multipleFilesFixture)).toEqual(true);
    } else {
      expect(getFilePermissions(pem, multipleFilesFixture)).toEqual(false);
    }
  });
});
