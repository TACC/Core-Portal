describe('MetadataFieldCtrl', ()=>{
    let element;
    let controller;
    let $compile;
    let scope;
    let mockedBindings;
    let mockedServices;
    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', {user: 'test_user'});
        angular.mock.inject(
            (_$rootScope_, _$q_, _$compile_, $componentController) => {
                $compile = _$compile_;
                scope = _$rootScope_.$new();
                scope.mockMeta = {
                    "mockField": "mockValue"
                }
                scope.onSave = ($value) => { };
                scope.$apply();

                element = angular.element('<metadata-field meta="mockMeta" label="mockLabel" field="mockField" on-save="onSave($value)"></metadata-field>')
                element = $compile(element)(scope);

                scope.$digest();
                controller = element.controller('metadata-field');
            }
        );
    });

    it ("should set edit modes", () => {
        controller.editField();
        expect(controller.isBeingEdited).toBe(true);
        controller.cancelEdit();
        expect(controller.isBeingEdited).toBe(false);
        controller.saveField();
        expect(controller.isBeingEdited).toBe(false);
    });

    it("should display the specified label", () => {
        expect(element.text()).toContain("mockLabel");
    });

    it ("should call onSave callback", () => {
        spyOn(scope, 'onSave');
        controller.saveField();
        expect(scope.onSave).toHaveBeenCalled();
    });
});
