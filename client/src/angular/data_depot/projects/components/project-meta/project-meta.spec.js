describe("ProjectMetadataComponent Error Case", () => {
    /**
     * A separate test case for errors if ProjectService returns
     * an error when retrieving metadata.
     * 
     * We need this because you can't unset a spy once it's been
     * set in beforeEach
     */
    let controller;
    let $q;
    let $compile;
    let scope;
    let element;
    let ProjectService;
    let $uibModal;

    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', {user: 'test_user'});
        angular.mock.module("portal.data_depot.projects");
        angular.mock.module("portal");
        angular.mock.inject(
            (_$q_, _$rootScope_, _$compile_, _ProjectService_, _$uibModal_) => {

            // Mock ProjectService.getBySystemId call and return mocked error 
            ProjectService = _ProjectService_;
            $q = _$q_;
            var deferred = $q.defer();
            deferred.reject({
                message: "Error message",
                status: 500
            });
            spyOn(ProjectService, 'getBySystemId').and.returnValue(deferred.promise);

            $compile = _$compile_;
            scope = _$rootScope_.$new();
            scope.$apply();

            let componentHtml = `
                <project-meta systemId="'mockId123'">
                </project-meta>
            `;

            element = angular.element(componentHtml);
            element = $compile(element)(scope);

            scope.$digest();
            controller = element.controller('project-meta');
        });
    });

    it("should display error messages if the system cannot be retrieved", () => {
        expect(ProjectService.getBySystemId).toHaveBeenCalled();
        expect(element.text()).toContain("Error message");
    });
});

describe('ProjectMetadataComponent', ()=>{
    let controller;
    let $q;
    let $compile;
    let scope;
    let element;
    let ProjectService;
    let $uibModal;

    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', {user: 'test_user'});
        angular.mock.module("portal.data_depot.projects");
        angular.mock.module("portal");
        angular.mock.inject(
            (_$q_, _$rootScope_, _$compile_, _ProjectService_, _$uibModal_) => {

            // Mock ProjectService.getBySystemId call and return mocked project metadata
            ProjectService = _ProjectService_;
            $q = _$q_;
            var deferred = $q.defer();
            deferred.resolve({
                response: {
                    "projectId": "mockId123",
                    "title" : "mockTitle",
                    "description" : "mockDescription",
                    "pi" : { username: "test_user", fullName: "mockPI" },
                    "owner": { username: "test_user", fullName: "mockPI"},
                    "coPis" : [ { username: "mcopi", fullName: "mockCoPI" },
                                { username: "mcopi2", fullName: "secondCoPI" } ],
                    "teamMembers" : [ {username: "mteam", fullName: "mockTeamMember" } ]
                },
                status: 200
            });
            spyOn(ProjectService, 'getBySystemId').and.returnValue(deferred.promise);

            // Don't actually open any modals
            $uibModal = _$uibModal_;
            spyOn($uibModal, 'open').and.callFake( () => { } );

            $compile = _$compile_;
            scope = _$rootScope_.$new();
            scope.$apply();

            let componentHtml = `
                <project-meta systemId="'mockId123'">
                </project-meta>
            `;

            element = angular.element(componentHtml);
            element = $compile(element)(scope);

            scope.$digest();
            controller = element.controller('project-meta');
        });
    });

    it("should instantiate the UI and controller", () => {
        expect(element.text()).toContain("mockTitle");
        expect(element.text()).toContain("mockDescription");
        expect(element.text()).toContain("mockPI");
        expect(element.text()).toContain("mockCoPI, secondCoPI");
        expect(controller).toBeTruthy();
    });

    it("should compute roles based on Django User", () => {
        // test_user is the PI and Owner
        expect(controller.isPI()).toBeTruthy();
        expect(controller.isOwner()).toBeTruthy();
        expect(controller.isCoPI()).not.toBeTruthy();

        // test_user is the a CoPI
        controller.data.meta.coPis[0].username = "test_user";
        expect(controller.isCoPI()).toBeTruthy();
    });

    it("should show and hide edit buttons", () => {
        // test_user is the PI and should have edit rights
        expect(element.text()).toContain("Edit Project Info");
        expect(element.text()).toContain("Manage Members");

        // test_user is not the PI or owner
        controller.data.meta.pi.username = "not_test_user";
        controller.data.meta.owner.username = "not_test_user";
        scope.$digest();
        expect(element.text()).not.toContain("Edit Project Info");
        expect(element.text()).not.toContain("Manage Members");
    });

    it("should return roles and resolve objects", () => {
        expect(controller.getRoles()).toBeTruthy();
        expect(controller.getModalResolve()).toBeTruthy();
    });

    it("should try to load the metadata modal", () => {
        controller.editMetadata();
        expect($uibModal.open).toHaveBeenCalled();
    });

    it("should try to open the membership modal", () => {
        controller.editMembers();
        expect($uibModal.open).toHaveBeenCalled();
    });
});
