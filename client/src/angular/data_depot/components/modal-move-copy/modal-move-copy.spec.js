import fileListing from '../../fixtures/file-listing.json';
import projectsListing from '../../fixtures/projects-listing.json';

describe('ModalMoveCopy', function() {
    var ctrl,
        $q,
        file,
        scope,
        $rootScope,
        FileListing,
        SystemsService,
        ProjectService,
        $componentController;


    // Mock only the necessary portal components
    beforeEach(angular.mock.module('portal'));
    beforeEach( ()=> {
        angular.mock.inject(function(_$componentController_, _FileListing_,
            _SystemsService_, _ProjectService_, _$q_, _$rootScope_) {
            $componentController = _$componentController_;
            FileListing = _FileListing_;
            SystemsService = _SystemsService_;
            ProjectService = _ProjectService_;
            $q = _$q_;
            scope = _$rootScope_.$new();
            SystemsService.systems = [
                {
                    name: 'My Data', systemId: 'test.system'
                }
            ];
            file = {
                system: 'agave.system',
                path: '/filename.txt',
                name: 'filename.txt',
                preview: function () {}
            };
            spyOn(FileListing, 'get').and.returnValue(
                $q.when(fileListing)
            );
            spyOn(ProjectService, 'list').and.returnValue(
                $q.when(projectsListing)
            );
            ctrl = $componentController(
                'modalMoveCopyComponent',
                {FileListing: FileListing, ProjectService:ProjectService, SystemsService:SystemsService},
                {
                    resolve: {
                        files: [file]
                    },
                    close: ()=>{},
                    dismiss: ()=>{}
                }
            );

        });
    });


    it ('should init with the file name as the current value', ()=> {
        spyOn(ctrl, 'selectMyData');
        ctrl.$onInit();
        expect(ctrl.files.length).toBe(1);
        expect(ctrl.files).toBeDefined();
        expect(ctrl.selectMyData).toHaveBeenCalled();
    });

    it('should update the breadcrumbs with a listing', ()=>{
        ctrl.$onInit();
        ctrl.selectMyData();
        scope.$digest();
        expect(ctrl.breadCrumbParams.filePath).toEqual('/test');
    });

    it('should list the projects', ()=>{
        ctrl.$onInit();
        ctrl.selectMyProjects();
        scope.$digest();
        expect(ctrl.listingProjects).toBe(true);
        expect(ProjectService.list).toHaveBeenCalled();
        expect(ctrl.projects.length).toEqual(projectsListing.length);
        expect(ctrl.busy).toBe(false);
    });

    it('should browse into a project', ()=>{
        ctrl.$onInit();
        ctrl.browseProject({}, projectsListing[0]);
        scope.$digest();
        expect(FileListing.get).toHaveBeenCalled();
        expect(ctrl.listing).toEqual(fileListing);
        expect(ctrl.listingProjects).toBe(false);
        expect(ctrl.busy).toBe(false);
    });



  });
