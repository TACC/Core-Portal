import {
  getSystemName,
  findSystemDisplayName,
  findProjectTitle,
  findSystemOrProjectDisplayName
} from './systems';
import systemsFixture from '../components/DataFiles/fixtures/DataFiles.systems.fixture';
import { projectsListingFixture } from '../redux/sagas/fixtures/projects.fixture';

describe('systems utility functions', () => {
  it('get system name from host', () => {
    expect(getSystemName('stampede2.tacc.utexas.edu')).toEqual('Stampede2');
  });
  it('get system display name from host', () => {
    const { configuration: systemList } = systemsFixture.storage;
    expect(findSystemDisplayName(systemList, 'frontera.home.username')).toEqual(
      'My Data (Frontera)'
    );
    expect(findSystemDisplayName(systemList, 'frontera.foo.bar')).toEqual(
      'Frontera'
    );
  });
  it('get project title from host', () => {
    expect(
      findProjectTitle(projectsListingFixture, 'test.site.project.PROJECT-3')
    ).toEqual('Test Project Title');
    expect(
      findProjectTitle(projectsListingFixture, 'test.site.project.PROJECT-X')
    ).toEqual('');
  });
  it('get project title based on resource', () => {
    const { configuration: systemList } = systemsFixture.storage;
    expect(
      findSystemOrProjectDisplayName(
        'projects',
        systemList,
        projectsListingFixture,
        'test.site.project.PROJECT-3'
      )
    ).toEqual('Test Project Title');
    expect(
      findSystemOrProjectDisplayName(
        'projects',
        systemList,
        projectsListingFixture,
        'test.site.project.PROJECT-X'
      )
    ).toEqual('');
  });
  it('get system display name based on resource', () => {
    const { configuration: systemList } = systemsFixture.storage;
    expect(
      findSystemOrProjectDisplayName(
        'private',
        systemList,
        projectsListingFixture,
        'frontera.home.username'
      )
    ).toEqual('My Data (Frontera)');
    expect(
      findSystemOrProjectDisplayName(
        'private',
        systemList,
        projectsListingFixture,
        'frontera.foo.bar'
      )
    ).toEqual('Frontera');
  });
});
