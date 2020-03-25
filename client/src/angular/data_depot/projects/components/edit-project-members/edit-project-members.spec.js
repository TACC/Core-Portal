describe('EditProjectMembersCtrl', ()=>{
    let scope;
    let $compile;
    let element;
    let controller;
    let $q;
    let ProjectService;
    let UserService;

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.mock.inject(
            (_$rootScope_, _$q_, _$compile_, _ProjectService_, _UserService_) => {

                // Mock ProjectService.addMember and .deleteMember calls
                ProjectService = _ProjectService_;
                UserService = _UserService_;
                $q = _$q_;
                var deferred = $q.defer();
                deferred.resolve({
                    response: {
                        "pi" : { username: "newpi", fullName: "New PI" }
                    },
                    status: 200
                });
                spyOn(ProjectService, 'addMember').and.returnValue(deferred.promise);
                spyOn(ProjectService, 'deleteMember').and.returnValue(deferred.promise);
                UserService.currentUser = { username: "newpi" };
                $compile = _$compile_;
                scope = _$rootScope_.$new();
                
                // Make a scope variable with all the data that would
                // otherwise be bound to the 'resolve' modal binding
                scope.mockResolve = {
                    meta : {
                        "projectId": "mockId123",
                        "title" : "mockTitle",
                        "description" : "mockDescription",
                        "pi" : { username: "mpi", fullName: "mockPI" },
                        "coPis" : [ { username: "mcopi", fullName: "mockCoPI"} ],
                        "teamMembers" : [ {username: "mteam", fullName: "mockTeamMember" } ]
                    },
                    roles: {
                        isPI: true,
                        isCoPI: false,
                        isOwner: true,
                    }
                };
                scope.$apply();

                let componentHtml = `
                    <edit-project-members-modal
                        resolve="mockResolve">
                    </edit-project-members-modal>
                `;

                element = angular.element(componentHtml);
                element = $compile(element)(scope);

                scope.$digest();
                controller = element.controller('edit-project-members-modal');
            }
        );
    });

    it("should compile the element and instantiate the controller", () => {
        expect(element.text()).toContain("Edit Project Members");
        expect(controller).toBeTruthy();
    });

    it("should compute permissions based on role", () => {
        // If there's no PI, the owner should be set the PI but nobody else 
        controller.meta.pi = null;
        controller.roles.isOwner = true;
        controller.roles.isPI = false;
        expect(controller.canSetPI()).toBeTruthy();
        expect(controller.canAddCoPI()).not.toBeTruthy();
        // Let's check the UI just to make sure the buttons are correct
        scope.$digest();
        expect(element.text()).toContain("Set the PI");
        expect(element.text()).not.toContain("Add a Co-PI");
        expect(element.text()).not.toContain("Add a Member");

        // If there's already a PI and the owner is not the PI,
        // they should NOT be able to change project members
        controller.meta.pi = { username: "mpi", fullName: "mockPI" };
        controller.roles.isOwner = true;
        controller.roles.isPI = false;
        controller.roles.isCoPI = false;
        expect(controller.canSetPI()).not.toBeTruthy();
        scope.$digest();
        expect(element.text()).not.toContain("Set the PI");
        expect(element.text()).not.toContain("Add a Co-PI");
        expect(element.text()).not.toContain("Add a Member");

        // A PI can change project members
        controller.roles.isOwner = false;
        controller.roles.isPI = true;
        controller.roles.isCoPI = false;
        expect(controller.canSetPI()).toBeTruthy();
        expect(controller.canAddCoPI()).toBeTruthy();
        scope.$digest();
        expect(element.text()).toContain("Set the PI");
        expect(element.text()).toContain("Add a Co-PI");
        expect(element.text()).toContain("Add a Member");

        // A Co-PI can change project members 
        controller.roles.isPI = false;
        controller.roles.isCoPI = true;
        expect(controller.canSetPI()).toBeTruthy();
        expect(controller.canAddCoPI()).toBeTruthy();
        scope.$digest();
        expect(element.text()).toContain("Set the PI");
        expect(element.text()).toContain("Add a Co-PI");
        expect(element.text()).toContain("Add a Member");

        // A person with no privileged roles should not be able
        // do anything
        controller.roles.isPI = false;
        controller.roles.isCoPI = false;
        controller.roles.isOwner = false;
        expect(controller.canSetPI()).not.toBeTruthy();
        expect(controller.canAddCoPI()).not.toBeTruthy();
        scope.$digest();
        expect(element.text()).not.toContain("Set the PI");
        expect(element.text()).not.toContain("Add a Co-PI");
        expect(element.text()).not.toContain("Add a Member");

    });

    it("should set PI change warnings depending on the user's role", () => {
        // A user can be the owner and also not be the PI
        controller.roles.isOwner = true;
        controller.roles.isPI = false;
        controller.setPIWarning();
        expect(controller.piChangeWarning).toContain("Once you set a PI");

        // A user can be just the PI
        controller.roles.isOwner = false;
        controller.roles.isPI = true;
        controller.setPIWarning();
        expect(controller.piChangeWarning).toContain("You are removing yourself");

        // A user who is CoPI should never be the owner or PI
        controller.roles.isOwner = false;
        controller.roles.isPI = false;
        controller.roles.isCoPI = true;
        controller.setPIWarning();
        expect(controller.piChangeWarning).toContain("You are replacing");
    });

    it("should show and hide the PI change controls", () => {
        // Default mock resolve sets the user as PI, so they
        // should see the "Set the PI" button
        expect(element.text()).toContain("Set the PI");

        // Now see if we can hide it while saving.
        controller.isSavingPI = true;
        scope.$digest();
        expect(element.text()).not.toContain("Set the PI");

        // Now see if we can hide it if they have no super user roles.
        controller.isSavingPI = false;
        controller.roles.isOwner = false;
        controller.roles.isPI = false;
        controller.roles.isCoPI = true;
        expect(element.text()).not.toContain("Set the PI");
    });

    it ("should display and hide the PI project-members-search component", () => {
        // Show the project-members-search component that has the expected label text
        let labeltext = "Select a user to be this project's PI"
        controller.showPISearch();
        scope.$digest();
        expect(element.text()).toContain(labeltext);

        // Now try to hide it, and expect that the label is gone
        controller.cancelSetPI();
        scope.$digest();
        expect(element.text()).not.toContain(labeltext);

    });

    it("should call the ProjectService to add a PI", () => {
        // Let's just make sure our sanity check works
        // and we can't set the PI to nobody.
        controller.setPI({ username: ""});
        expect(ProjectService.addMember).not.toHaveBeenCalled();

        // Now call setPI with a real value and see that the service was called
        controller.setPI({ username: "mockpi" });
        expect(ProjectService.addMember).toHaveBeenCalled();
    });

    it("should update this.meta with new values from ProjectService response upon setPI", () => {
        // Before 'newpi' is the PI of this project, they cannot change members
        controller.roles.isPI = false;
        controller.roles.isCoPI = false;
        scope.$digest();
        expect(element.text()).not.toContain('Add a Member');
        // Call setPI - the mocked ProjectService will always return
        // 'newpi' in the faked metadata response
        controller.setPI({ username: 'newpi' });
        scope.$digest();
        expect(controller.meta.pi.username).toEqual("newpi");
        // The new PI should be able to add members
        expect(controller.roles.isPI).toEqual(true);
        expect(controller.canAddCoPI()).toEqual(true);
        expect(element.text()).toContain('Add a Member');
    });

    it ("should generate validator warnings when trying to add users that already have a role", () => {
        let piUser = { username: "mpi", fullName: "Mock PI" };
        expect(controller.coPIValidator(piUser)).toContain("currently the project's PI");
        expect(controller.teamMemberValidator(piUser)).toContain("currently the project's PI");

        let coPIUser = { username: "mcopi", fullName: "Mock Co-PI" };
        expect(controller.coPIValidator(coPIUser)).not.toBeTruthy();
        expect(controller.teamMemberValidator(coPIUser)).toContain("is currently a Co-PI");

        let memberUser = { username: "mteam", fullName: "Team Member" };
        expect(controller.coPIValidator(memberUser)).toContain("is currently a Team Member");
        expect(controller.teamMemberValidator(memberUser)).not.toBeTruthy();

        let newUser = { username: "newuser", fullName: "New User" };
        expect(controller.coPIValidator(newUser)).not.toBeTruthy();
        expect(controller.teamMemberValidator(newUser)).not.toBeTruthy();
    });

    it("should dismiss", () => {
        spyOn(controller, 'dismiss');
        controller.ok();
        expect(controller.dismiss).toHaveBeenCalled();
    });

});
