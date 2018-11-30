describe('ProjectMetadataCtrl $onInit', ()=>{
    let controller, deferred, $scope, systemByIdDeferred;
    const systemId = 'prtl.project.PRJ-123';
    const project = {
        'title': 'Project Title',
        'projectId': 'PRJ-123',
        'description': 'Project Title',
        'created': '2018-11-27T22:27:52.559593',
        'lastModified': '2018-11-27T22:27:52.559593',
        'pi': {
            'fullName': 'User, Test',
            'username': 'test_username',
        },
        'coPis': [{
            'fullName': 'Co PI Test, User',
            'username': 'co_pi_one',
        },{
            'fullName': 'Co PI Test, User Two',
            'username': 'co_pi_two',
        }],
        'teamMembers': [{
            'fullName': 'Member, Team One',
            'username': 'team_member_one',
        },{
            'fullName': 'Member, Team Two',
            'username': 'team_member_two',
        }]
    };

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', {user: 'test_user'});
        angular.mock.inject(
            (_$q_, _$rootScope_, _ProjectService_,
             _$uibModal_, $componentController) => {
                $scope = _$rootScope_.$new();
                deferred = _$q_.defer();
                systemByIdDeferred = _$q_.defer();
                const mockedServices = {
                    ProjectService: _ProjectService_,
                    $uibModal: _$uibModal_,
                };
                const mockedBindings = {
                    systemId: systemId,
                };
                controller = $componentController(
                    'projectMeta',
                    mockedServices,
                    mockedBindings
                );
            }
        );
    });

    it('should initialize controller', () => {
        spyOn(
            controller.ProjectService,
            'getBySystemId'
        ).and.returnValue(systemByIdDeferred.promise);
        // Initialize controller
        controller.$onInit();

        // Check if we're setting loading flag.
        expect(controller.ui.loading).toBeTruthy();

        systemByIdDeferred.resolve({
            status: 200,
            response: project,
        });
        $scope.$apply();
        expect(controller.data.meta).toEqual(project);
        expect(controller.ui.loading).toBeFalsy();
    });

    it('should handle error when initializing', () => {
        spyOn(
            controller.ProjectService,
            'getBySystemId'
        ).and.returnValue(systemByIdDeferred.promise);
        // Initialize controller
        controller.$onInit();

        // Check if we're setting loading flag.
        expect(controller.ui.loading).toBeTruthy();

        systemByIdDeferred.reject({
            status: 500,
            message: 'Error message.',
        });
        $scope.$apply();
        expect(controller.data.meta).toBeFalsy();
        expect(controller.ui.error).toBeTruthy();
        expect(controller.ui.error.status).toEqual(500);
        expect(controller.ui.error.message).toEqual('Error message.');
    });
});

describe('ProjectMetadataCtrl', ()=>{
    let controller, deferred, $scope, systemByIdDeferred;
    const systemId = 'prtl.project.PRJ-123';
    const project = {
        'title': 'Project Title',
        'projectId': 'PRJ-123',
        'description': 'Project Title',
        'created': '2018-11-27T22:27:52.559593',
        'lastModified': '2018-11-27T22:27:52.559593',
        'pi': {
            'fullName': 'User, Test',
            'username': 'test_username',
        },
        'coPis': [{
            'fullName': 'Co PI Test, User',
            'username': 'co_pi_one',
        },{
            'fullName': 'Co PI Test, User Two',
            'username': 'co_pi_two',
        }],
        'teamMembers': [{
            'fullName': 'Member, Team One',
            'username': 'team_member_one',
        },{
            'fullName': 'Member, Team Two',
            'username': 'team_member_two',
        }]
    };

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', {user: 'test_user'});
        angular.mock.inject(
            (_$q_, _$rootScope_, _ProjectService_,
             _$uibModal_, $componentController) => {
                $scope = _$rootScope_.$new();
                deferred = _$q_.defer();
                systemByIdDeferred = _$q_.defer();
                const mockedServices = {
                    ProjectService: _ProjectService_,
                    $uibModal: _$uibModal_,
                };
                const mockedBindings = {
                    systemId: systemId,
                };
                controller = $componentController(
                    'projectMeta',
                    mockedServices,
                    mockedBindings
                );
                spyOn(
                    controller.ProjectService,
                    'getBySystemId'
                ).and.returnValue(systemByIdDeferred.promise);
                // Initialize controller
                controller.$onInit();
                systemByIdDeferred.resolve({
                    status: 200,
                    response: project,
                });
                $scope.$apply();
            }
        );
    });

    it('Should allow/not allow to edit team member.', ()=> {
        //First user has no pem to edit users. CANNOT edit users.
        expect(controller.canEditTeamMembers()).toEqual(false);
        //Change user to be able to edit users. PIs CAN edit users.
        controller.Django.user = 'test_username';
        $scope.$apply();
        expect(controller.canEditTeamMembers()).toEqual(true);
        //Change user to be able to edit users. CO-PIs CAN edit users.
        controller.Django.user = 'co_pi_one';
        $scope.$apply();
        expect(controller.canEditTeamMembers()).toEqual(true);
        //Remove PI. CAN edit users
        controller.data.meta.pi = null;
        $scope.$apply();
        expect(controller.canEditTeamMembers()).toEqual(true);
        //Remove COPIs. CAN edit users.
        controller.data.meta.coPis = [];
        $scope.$apply();
        expect(controller.canEditTeamMembers()).toEqual(true);

    });
});


describe('ProjectMetadataComponent init', ()=>{
    let controller, deferred, $scope, systemByIdDeferred,
        element, $httpBackend, systemByIdResponse;
    const systemId = 'prtl.project.PRJ-123';
    const project = {
        'title': 'Project Title',
        'projectId': 'PRJ-123',
        'description': 'Project Title',
        'created': '2018-11-27T22:27:52.559593',
        'lastModified': '2018-11-27T22:27:52.559593',
        'pi': {
            'fullName': 'User, Test',
            'username': 'test_username',
        },
        'coPis': [{
            'fullName': 'Co PI Test, User',
            'username': 'co_pi_one',
        },{
            'fullName': 'Co PI Test, User Two',
            'username': 'co_pi_two',
        }],
        'teamMembers': [{
            'fullName': 'Member, Team One',
            'username': 'team_member_one',
        },{
            'fullName': 'Member, Team Two',
            'username': 'team_member_two',
        }]
    };

    // Mock requirements.
    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', {user: 'test_user'});
        angular.mock.module("portal.data_depot.projects");
        angular.mock.module("portal");
        angular.mock.inject(
            (_$q_, _$rootScope_, _$compile_, _$httpBackend_) => {
                $httpBackend = _$httpBackend_;
                systemByIdResponse = $httpBackend.when(
                    'GET',
                    '/api/projects/system/'+systemId+'/'
                );
                $scope = _$rootScope_.$new();
                $scope.systemId = systemId;
                deferred = _$q_.defer();
                element = _$compile_(
                    angular.element('<project-meta system-id="systemId"></project-meta>')
                )($scope);
                controller = element.controller('project-meta');
            }
        );
    });

    it('Checks loading message is showing correctly', ()=>{
        systemByIdResponse.respond(500, {});

        $scope.$digest();
        let content = element[0].querySelector('.loading');
        expect(content).not.toEqual(null);


        $httpBackend.flush();
        $scope.$digest();

        content = element[0].querySelector('.loading');
        expect(content).toEqual(null);
    });

    it('should initialize controller', () => {
        systemByIdResponse.respond(
            200,
            {
                status:200,
                response: project,
            }
        );

        // Check if there's no project meta yet..
        let content = element[0].querySelector('.prj-meta-content');
        expect(content).toEqual(null);

        $httpBackend.flush();
        $scope.$digest();

        content = element[0].querySelector('.prj-meta-content');
        expect(content).not.toEqual(null);
    });

    it('should handle error when initializing', () => {
        systemByIdResponse.respond(
            500,
            {
                status: 500,
                message: 'Error message.',
            }
        );

        let content = element[0].querySelector('.error');
        expect(content).toEqual(null);

        $httpBackend.flush();
        $scope.$digest();

        content = element[0].querySelector('.error');
        expect(content).not.toEqual(null);
        expect(content.querySelector('p').textContent.trim()).toEqual('Error message.');
    });
});

describe('ProjectMetadataComponent', ()=>{
    let controller, deferred, $scope, systemByIdDeferred,
        element, $httpBackend, systemByIdResponse;
    const systemId = 'prtl.project.PRJ-123';
    const project = {
        'title': 'Project Title',
        'projectId': 'PRJ-123',
        'description': 'Project Title',
        'created': '2018-11-27T22:27:52.559593',
        'lastModified': '2018-11-27T22:27:52.559593',
        'pi': {
            'fullName': 'User, Test',
            'username': 'test_username',
        },
        'coPis': [{
            'fullName': 'Co PI Test, User',
            'username': 'co_pi_one',
        },{
            'fullName': 'Co PI Test, User Two',
            'username': 'co_pi_two',
        }],
        'teamMembers': [{
            'fullName': 'Member, Team One',
            'username': 'team_member_one',
        },{
            'fullName': 'Member, Team Two',
            'username': 'team_member_two',
        }]
    };

    // Mock requirements.
    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', {user: 'test_user'});
        angular.mock.module("portal.data_depot.projects");
        angular.mock.module("portal");
        angular.mock.inject(
            (_$q_, _$rootScope_, _$compile_, _$httpBackend_) => {
                $httpBackend = _$httpBackend_;
                systemByIdResponse = $httpBackend.when(
                    'GET',
                    '/api/projects/system/'+systemId+'/'
                );
                $scope = _$rootScope_.$new();
                $scope.systemId = systemId;
                deferred = _$q_.defer();
                element = _$compile_(
                    angular.element('<project-meta system-id="systemId"></project-meta>')
                )($scope);
                controller = element.controller('project-meta');
                systemByIdResponse.respond(
                    200,
                    {
                        status:200,
                        response: project,
                    }
                );
                $httpBackend.flush();
                $scope.$digest();
            }
        );
    });

    it('Should show team members when clicking Show More', ()=>{
        controller.toggleShowMore();
        $scope.$digest();

        let content = element[0].querySelector('.team-members');
        expect(content).not.toEqual(null);
        expect(
            content.querySelectorAll('.team-member-row').length
        ).toEqual(
            1 + project.coPis.length + project.teamMembers.length
        );
    });

    it('Should allow/not allow to edit team member.', ()=> {
        controller.toggleShowMore();
        //First user has no pem to edit users. CANNOT edit users.
        let content = element[0].querySelector('.edit-member-btn');
        expect(content).toEqual(null);
        //Change user to be able to edit users. PIs CAN edit users.
        controller.Django.user = 'test_username';
        $scope.$apply();
        content = element[0].querySelector('.edit-member-btn');
        expect(content).not.toEqual(null);
        //Change user to be able to edit users. CO-PIs CAN edit users.
        controller.Django.user = 'co_pi_one';
        $scope.$apply();
        content = element[0].querySelector('.edit-member-btn');
        expect(content).not.toEqual(null);
        //Remove PI. CAN edit users
        controller.data.meta.pi = null;
        $scope.$apply();
        content = element[0].querySelector('.edit-member-btn');
        expect(content).not.toEqual(null);
        //Remove COPIs. CAN edit users.
        controller.data.meta.coPis = [];
        $scope.$apply();
        content = element[0].querySelector('.edit-member-btn');
        expect(content).not.toEqual(null);

    });

});
