import template from './../templates/submit-ticket.html';

describe("submitTicket", function() {
    var scope;
    var $compile;
    var testCases = [
        { 
            bindings: 'subject="mock subject"',
            query_string: '?subject=mock%20subject'
        },
        {
            bindings: 'info="mock client info"',
            query_string: '?info=mock%20client%20info'
        },
        {
            bindings: 'subject="mock subject" info="mock client info"',
            query_string: '?info=mock%20client%20info&subject=mock%20subject'
        },
        {
            bindings: '',
            query_string: ''
        }
    ]

    // Mock only the necessary portal components
    beforeEach(angular.mock.module("portal.workbench.components"));
    
    beforeEach( ()=> {
        angular.module('django.context', []).constant('Django', {user: 'test_user'});
        // Setup our component test
        angular.mock.inject(function(_$rootScope_, _$compile_) {
            // Bring in the $compile provider for UI testing
            $compile = _$compile_;
            
            // Create a fake root scope for the UI component, with mocked data
            scope = _$rootScope_.$new();
            scope.$apply();
        });
    });

    
    it ("should render correctly and display 'submit a ticket'", () => {
        // Spawn the UI element
        let element = $compile('<submit-ticket></submit-ticket>')(scope);
        scope.$digest();

        expect(element.text()).toContain('submit a ticket');
    });

    it ("should compute query_string depending on provided bindings", () => {
        // Create a directive that we can sub in test case bindings
        let componentDirective = "<submit-ticket BINDINGS></submit-ticket>";

        for (let testCase of testCases) {
            // Create an element for a test case
            let element = $compile(componentDirective.replace("BINDINGS", testCase.bindings))(scope);
            let controller = element.controller('submit-ticket');
            scope.$digest();

            // Check the controller's query_string variable
            expect(controller.query_string).toEqual(testCase.query_string);
            // Check the link to make sure it's correct
            expect(element.find('a').attr('ng-href')).toEqual('/tickets/ticket/new' + testCase.query_string);
        }
    });
  });