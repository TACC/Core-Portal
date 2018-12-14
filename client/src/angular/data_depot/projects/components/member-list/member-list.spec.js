describe('MemberListCtrl', ()=>{
    let element;
    let controller;
    let $compile;
    let scope;
    let $q;
    let ProjectService;
    let mockUser = { username: "mockuser", first_name: "Mock", last_name: "Name" };

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', {user: 'test_user'});
        angular.mock.inject(
            (_$rootScope_, _$q_, _$compile_, _ProjectService_) => {
                ProjectService = _ProjectService_;
                $q = _$q_;
                $compile = _$compile_;
                scope = _$rootScope_.$new();
                scope.mockMeta = {
                    teamMembers: []
                }
                scope.validator = ($user) => { return null };
                scope.canEdit = true;
                scope.$apply();

                let componentHtml = `
                    <member-list 
                        meta="mockMeta" 
                        label="Team Members" 
                        button-text="mockButton"
                        field="teamMembers"
                        member-type="team_member"
                        validator="validator($user)"
                        editable="canEdit">
                    </member-list>
                `;

                element = angular.element(componentHtml);
                element = $compile(element)(scope);

                scope.$digest();
                controller = element.controller('member-list');
            }
        );
    });

    it ("should instantiate", () => {
        expect(controller).toBeTruthy();

    });

    it("should display the specified labels", () => {
        expect(element.text()).toContain("Team Members");
        expect(element.text()).toContain("mockButton");
    });

    it("should disable editing", () => {
        scope.canEdit = false;
        scope.$apply();
        scope.$digest();
        expect(element.text()).not.toContain("mockButton");
    });

    it("should validate user choices", () => {
        spyOn(scope, 'validator').and.returnValue("warning");
        controller.addMember(mockUser);
        expect(scope.validator).toHaveBeenCalled();
        scope.$digest();
        expect(element.text()).toContain("warning");
    });

    it ("should add members", () => {
        var deferred = $q.defer();
        deferred.resolve({
            response: {
                teamMembers: [ mockUser ],
                status: 200
            }
        });
        spyOn(ProjectService, 'addMember').and.returnValue(deferred.promise);
        controller.addMember(mockUser);
        expect(ProjectService.addMember).toHaveBeenCalled();
   });

   it ("should remove members", () => {
        var deferred = $q.defer();
        deferred.resolve({
            response: {
                teamMembers: [ mockUser ],
            },
            status: 200
        });
        spyOn(ProjectService, 'deleteMember').and.returnValue(deferred.promise);
        controller.removeMember(mockUser);
        expect(ProjectService.deleteMember).toHaveBeenCalled();
    });

});
