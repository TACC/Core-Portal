import { moveFileUtil } from './useMove';
// import configureStore from 'redux-mock-store';

// const mockStore = configureStore();

describe('useMove mutation using React Query', () => {
  it('runs the moveFileUtil function', () => {
    // Make a test file and folder first
    const testFile = {
      name: 'test.txt',
      path: '/test.txt',
    };
    const testFolder = {
      name: 'testFolder',
      path: '/testFolder',
    };

    // Define parameters of moveFileUtil
    moveFileUtil({
      api: 'tapis',
      scheme: 'private',
      system: 'cloud.data',
      path: `${testFile.path}`,
      destSystem: 'cloud.data',
      destPath: `${testFolder.path}`,
    });

    // Ignore this test
    expect(2 + 2).toEqual(4);
  });
});
