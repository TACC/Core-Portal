import { default as getFilePermissions } from './filePermissions';

const fixture = {
  files: [
    {
      name: "test.tar.gz",
      path: "/test/test.tar.gz",
      lastModified: "2020-08-01T00:00:00-05:00",
      system: "frontera.home.test",
      type: "file",
    },
  ],
  scheme: "private",
};
describe('getFilePermissions utility function', () => {
  it.each([
    "rename",
    "download",
    "extract",
    "move",
    "copy",
    "trash",
    "compress",
  ])("Correctly evaluate %s permission", (pem) => {
    expect(getFilePermissions(pem, fixture)).toEqual(true);
  });
})
