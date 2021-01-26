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
    const { list: systemList } = systemsFixture.datafiles;
    expect(findSystemDisplayName(systemList, 'frontera.home.username')).toEqual(
      'My Data (Frontera)'
    );
    expect(findSystemDisplayName(systemList, 'frontera.foo.bar')).toEqual(
      'Frontera'
    );
  });
  it('get project title from host', () => {
    expect(
      findProjectTitle(projectsListingFixture, 'test.site.project.FRONTERA-3')
    ).toEqual('Test Project Title');
    expect(
      findProjectTitle(projectsListingFixture, 'test.site.project.FRONTERA-X')
    ).toEqual('Shared Workspaces');
  });
  it('get project title based on resource', () => {
    const { list: systemList } = systemsFixture.datafiles;
    expect(
      findSystemOrProjectDisplayName(
        'projects',
        systemList.datafiles,
        projectsListingFixture,
        'test.site.project.FRONTERA-3'
      )
    ).toEqual('Test Project Title');
    expect(
      findSystemOrProjectDisplayName(
        'projects',
        systemList,
        projectsListingFixture,
        'test.site.project.FRONTERA-X'
      )
    ).toEqual('Shared Workspaces');
  });
  it('get system display name based on resource', () => {
    const { list: systemList } = systemsFixture.datafiles;
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
