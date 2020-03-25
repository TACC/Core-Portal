describe('NotificationsModalCtrl', ()=>{
    let scope;
    let $compile;
    let element;
    let controller;

    // Mock requirements.
    beforeEach(angular.mock.module("portal"));
    beforeEach( ()=> {
        angular.mock.inject(
            (_$rootScope_, _$q_, _$compile_, _ProjectService_, _UserService_) => {

                $compile = _$compile_;
                scope = _$rootScope_.$new();
                scope.mockResolve = {
                    note: {
                        datetime: new Date(),
                        message: "message",
                        status: "info",
                        action_link: "link",
                        extra: {
                            id: "1234",
                            error_message: "error"
                        }
                    }
                }
                
                scope.$apply();

                let componentHtml = `
                    <notifications-modal
                        resolve="mockResolve">
                    </notifications-modal>
                `;

                element = angular.element(componentHtml);
                element = $compile(element)(scope);

                scope.$digest();
                controller = element.controller('notifications-modal');
            }
        );
    });

    it("should compile the element and instantiate the controller", () => {
        expect(controller).toBeTruthy();
        expect(controller.notif).toEqual(scope.mockResolve.notif);
        expect(element.text()).toContain("message");
        expect(element.text()).toContain("info");
        expect(element.text()).toContain("link");
        expect(element.text()).toContain("1234");
        expect(element.text()).toContain("error");
    });
});
