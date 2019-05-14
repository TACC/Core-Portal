describe('WorkspaceDataBrowserCtrl', ()=>{
    let controller, $scope;
    let SystemsService, ProjectService, DataBrowserService;
    let $q;

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.mock.inject((
            _$q_,
            _$rootScope_,
            $componentController,
            _ProjectService_,
            _SystemsService_,
            _DataBrowserService_
        ) => {
            $scope = _$rootScope_.$new();
            $q = _$q_;
            let deferredSystemsListing = $q.defer();
            deferredSystemsListing.resolve([
                {
                    systemId: "cep.home.test",
                    name: "My Data"
                },
                {
                    systemId: "cep.community",
                    name: "Community Data"
                }
            ]);

            let deferredProjectList = $q.defer();
            deferredProjectList.resolve([
                {
                    id: "cep.project.test",
                    name: "CEP-PROJECT",
                    description: "Test Project"
                }
            ]);

            let deferredDataBrowserBrowse = $q.defer();
            deferredDataBrowserBrowse.resolve({
                "name": "cep.home.test",
                "system": "cep.home.test",
                "format": "folder",
                "children": [ ],
                "path" : "/"
            })

            DataBrowserService = _DataBrowserService_;
            SystemsService = _SystemsService_;
            ProjectService = _ProjectService_;

            spyOn(SystemsService, 'listing').and.returnValue(deferredSystemsListing.promise);
            spyOn(ProjectService, 'list').and.returnValue(deferredProjectList.promise);
            spyOn(DataBrowserService, 'browse').and.returnValue(deferredDataBrowserBrowse.promise);

            controller = $componentController('workspaceDataBrowser');
            controller.$onInit();
        });
    });
    it('should initialize controller', () => {
        expect(controller).toBeDefined();
    });
    it('should get a project listing when My Projects is selected', () => {
        controller.data.cOption = {
            label: "My Projects",
            apiParams: {
                fileMgr: 'agave',
                baseUrl: '/api/files'
            },
            conf: "mock"
        }
        controller.dataSourceUpdated();
        $scope.$digest();
        expect(controller.data.projects.length).toEqual(1);
    });
});
