import findProjectTitle from './projects';
import { projectsListingFixture } from '../redux/sagas/fixtures/projects.fixture'
  
  
  describe('projects utility functions', () => {
    it('get project title from host', () => {
      expect(findProjectTitle(projectsListingFixture, 'test.site.project.FRONTERA-3')).toEqual('Test Project Title');
      expect(findProjectTitle(projectsListingFixture, 'test.site.project.FRONTERA-X')).toEqual('Shared Workspaces');
    });
  });
  