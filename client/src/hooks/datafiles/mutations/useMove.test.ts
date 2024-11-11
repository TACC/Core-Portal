// import statements go here when needed
import { string } from "prop-types";
import { moveFileUtil } from "./useMove";
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
            path: '/testFolder'
        }
        
        // Define parameters of moveFileUtil
        moveFileUtil({
            api: 'tapis',
            scheme: 'private',
            system: 'frontera.home.username',
            path: `${testFile.path}`,
            destSystem: '',
            destPath: ''
        });
    });
});