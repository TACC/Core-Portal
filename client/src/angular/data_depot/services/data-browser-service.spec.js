describe("DataBrowserService", function() {
    var DataBrowserService, $httpBackend, $uibModal,
        $q, FileListing, options;
    beforeEach(angular.mock.module("portal"));
    beforeEach(() => {
        angular.mock.inject(function(
            _$httpBackend_, _DataBrowserService_, _Jobs_, _$uibModal_, _$q_, _FileListing_,
            _$mdToast_, _SystemsService_, _$rootScope_) {
            DataBrowserService = _DataBrowserService_;
            $httpBackend = _$httpBackend_;
            $uibModal = _$uibModal_;
            FileListing = _FileListing_;
            $q = _$q_;

            options = {
                system: 'test-system',
                path: '/',
                name: '',
                directory: '/',
                queryString: '',
            };
        });
    });

    it("Should have a state", function() {
        expect(DataBrowserService.state).toBeDefined();
        expect(DataBrowserService.browse).toBeDefined();
        expect(DataBrowserService.search).toBeDefined();
        expect(DataBrowserService.download).toBeDefined();
        expect(DataBrowserService.preview).toBeDefined();
        expect(DataBrowserService.upload).toBeDefined();
        expect(DataBrowserService.select).toBeDefined();
    });

    it("should handle a listing", () => {
        var httpResponse;
        var data = {
            response: {
                "name": "test",
                "system": "test-system",
                "format": "folder",
                "children": [
                    {
                        "name": "test_child1.txt",
                        "system": "test-system",
                        "path": "/test_child1.txt"
                    },
                    {
                        "name": "test_child2.txt",
                        "system": "test-system",
                        "path": "/test_child1.txt"
                    }
                ]
            }
        };

        //Use a regex so that any query param will pass through
        $httpBackend.whenGET(/api\/data-depot\/files\/listing\/my-data\/test-system*/).respond(200, data);
        DataBrowserService.apiParams.fileMgr = 'my-data';
        DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
        DataBrowserService.apiParams.searchState = 'wb.data_depot.db';
        DataBrowserService.browse(options);
        $httpBackend.flush();
        let state = DataBrowserService.state();
        // The listing should be a Listing() object with some methods
        expect(state.listing.uuid).toBeDefined();
        expect(state.listing.copy).toBeDefined();
        expect(state.listing.download).toBeDefined();
        expect(state.listing.preview).toBeDefined();

        // there should be 2 children
        expect(state.listing.children.length).toEqual(2);

        // Children should be Listing() also
        let child1 = state.listing.children[0];
        expect(child1.copy).toBeDefined();

        // let result1 = httpResponse.response.hits[0];
        // have to compare date times, not objects
        // expect(result1.lastModified.getTime()).toEqual(new Date("2018-01-01").getTime());

    });

    it("should provide correct error message/status during a failed listing", () => {
        let error_status = 502;
        let error_message = "error message"
        var data = {
            "message": error_message,
        };

        //Use a regex so that any query param will pass through
        $httpBackend.whenGET(/api\/data-depot\/files\/listing\/my-data\/test-system*/).respond(error_status, data);
        DataBrowserService.apiParams.fileMgr = 'my-data';
        DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
        DataBrowserService.browse(options);
        $httpBackend.flush();
        let state = DataBrowserService.state();

        // Error should have a message and status
        expect(state.error.message).toEqual(error_message);
        expect(state.error.status).toEqual(error_status);
    });

    it("should open a modal on copy", () => {
        let files = [{ "name": "test", "system": "test-system" }];
        var fakePromise = $q.resolve({});
        let mockModal = {
            result: fakePromise
        };
        spyOn($uibModal, 'open').and.returnValue(mockModal);
        DataBrowserService.copy(files);
        expect($uibModal.open).toHaveBeenCalled();
    });

    it("should handle a download", () => {
        let files = [
            FileListing.init({ "name": "test", "system": "test-system" }),
            FileListing.init({ "name": "test", "system": "test-system" })
        ];
        var httpResp;
        let data = { response: "ok" };
        $httpBackend.whenPUT(/api\/data-depot\/files*/).respond(200, data);
        //the resp shuold be a $q.all() with 2 promises
        let res = DataBrowserService.download(files);
        res.then((resp) => { httpResp = resp; });
        $httpBackend.flush();
        expect(httpResp.length).toEqual(2);
    });

    it("should test that files can be trashed", () => {
        var httpResponse;
        var data = {
            response: {
                "name": "test",
                "system": "test-system",
                "format": "folder",
                "path": "/",
                "permissions": "ALL",
                "children": [
                    {
                        "name": "test_child1.txt",
                        "system": "test-system",
                        "path": "/test_child1.txt"
                    },
                    {
                        "name": "test_child2.txt",
                        "system": "test-system",
                        "path": "/test_child1.txt"
                    }
                ]
            }
        }

        //Use a regex so that any query param will pass through
        $httpBackend.whenGET(/api\/data-depot\/files\/listing\/my-data\/test-system*/).respond(200, data);
        DataBrowserService.apiParams.fileMgr = 'my-data';
        DataBrowserService.apiParams.baseUrl = '/api/data-depot/files';
        DataBrowserService.apiParams.searchState = 'wb.data_depot.db';
        DataBrowserService.browse(options);
        $httpBackend.flush();

        let files = [
            {
                name: "testfile",
                permissions: "READ_WRITE",
                system: "cep.home.test",
                trail: ["/"]
            }
        ];
        let result = DataBrowserService.canTrash('wb.data_depot.db', files);
        expect(result).toEqual(true);
    })

});
