describe('EditProjectMetadataCtrl', ()=>{
    let scope;
    let $compile;
    let element;
    let controller;
    let $q;
    let ProjectService;

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.mock.inject(
            (_$rootScope_, _$q_, _$compile_, _ProjectService_) => {

                // Mock ProjectService.update call
                ProjectService = _ProjectService_;
                $q = _$q_;
                var deferred = $q.defer();
                deferred.resolve({
                    response: {
                    },
                    status: 200
                });
                spyOn(ProjectService, 'update').and.returnValue(deferred.promise);

                $compile = _$compile_;
                scope = _$rootScope_.$new();

                // Make a scope variable with all the data that would
                // otherwise be bound to the 'resolve' modal binding
                scope.mockResolve = {
                    meta : {
                        "projectId": "mockId123",
                        "title" : "mockTitle",
                        "description" : "mockDescription"
                    },
                    roles: {
                        isPI: true,
                        isCoPI: false,
                        isOwner: true,
                    }
                }; 
                scope.$apply();

                let componentHtml = `
                    <edit-project-metadata-modal
                        resolve="mockResolve" 
                        editable="canEdit">
                    </edit-project-metadata-modal>
                `;

                element = angular.element(componentHtml);
                element = $compile(element)(scope);

                scope.$digest();
                controller = element.controller('edit-project-metadata-modal');
            }
        );
    });

    it("should display the title and description", () => {
        expect(element.text()).toContain("mockTitle");
        expect(element.text()).toContain("mockDescription");
    });

    it ("should correctly compute editing permissions", () => {
        expect(element.text()).toContain("Edit");
        scope.mockResolve.meta.pi = "mockPi";
        scope.mockResolve.roles = {
            isPI: false,
            isCoPI: false,
            isOnwer: false
        }
        scope.$apply();
        scope.$digest();
        expect(controller.canEdit()).toEqual(false);
    });

    it ("should save changes", () => {
        controller.saveField({ field: "title", value: "new title" });
        expect(ProjectService.update).toHaveBeenCalled();
    });

    it ("should display and hide the Saving notification", () => {
        controller.fieldSaving["title"] = true;
        scope.$digest();
        expect(element.text()).toContain("Saving");
        controller.fieldSaving["title"] = false;
        scope.$digest();
        expect(element.text()).not.toContain("Saving");
    });

});
