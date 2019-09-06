describe("ZipService", function() {
    let ZipService,
        $uibModal, 
        $q, 
        Jobs, 
        $mdToast, 
        SystemsService, 
        $httpBackend,
        Apps,
        $scope;

    beforeEach(angular.mock.module("portal"));
    beforeEach(() => {
        angular.mock.inject(function(_$httpBackend_) {
            $httpBackend = _$httpBackend_;
            let response = {
                data : {
                    response: [
                        {
                            id: "zippy-0.1u1",
                            revision: 1
                        },
                        {
                            id: "extract-0.1u3",
                            revision: 3
                        }
                    ]
                }
            }
            $httpBackend.whenGET("/api/workspace/apps?publicOnly=true").respond(response);
        });
    });
    beforeEach(() => {
        angular.mock.inject(function(_Jobs_,  _$uibModal_, _$q_, _$mdToast_, 
                    _SystemsService_, _ZipService_, _$rootScope_, _Apps_) {
            ZipService = _ZipService_;
            $uibModal = _$uibModal_;
            $q = _$q_;
            Jobs = _Jobs_;
            $mdToast = _$mdToast_;
            SystemsService = _SystemsService_;
            Apps = _Apps_;
            $scope = _$rootScope_.$new();
        });
    });

    it("should get zippy and extract apps on init", () => {
        spyOn(Apps, 'getPublic').and.returnValue(
            $q.resolve(
                {
                    data : {
                        response: [
                            {
                                id: "zippy-0.1u6",
                                revision: 6
                            },
                            {
                                id: "extract-0.1u3",
                                revision: 3
                            }
                        ]
                    }
                }
            )
        );
        spyOn(Apps, 'get').and.returnValue(
            $q.resolve(
                {
                    data: {
                        response: {
                            parameters: [
                                {
                                    id: "compression_type"
                                }
                            ]
                        }
                    }
                }
            )
        )
        ZipService.init();
        $scope.$digest();
        expect(Apps.getPublic).toHaveBeenCalled();
        expect(Apps.get).toHaveBeenCalled();
        expect(ZipService.zippyAppId).toEqual("zippy-0.1u6");
        expect(ZipService.extractAppId).toEqual("extract-0.1u3");
        expect(ZipService.targzSupport).toEqual(true);
    });

    it("should resolve a working directory for a file object", () => {
        let file = {
            system: "test-system",
            path: "/test/folder/filename.txt"
        };
        expect(ZipService.getWorkingDirectory(file)).toEqual(
            "agave://test-system/test/folder/"
        );
    });

    it("should resolve an agave name for a file object", () => {
        let file = {
            system: "test-system",
            path: "/test/folder/filename.txt"
        }
        expect(ZipService.getAgaveName(file)).toEqual(
            "agave://test-system/test/folder/filename.txt"
        )
    });

    it("should get the latest app from a list of apps", () => {
        let apps = [
            { 
                id: "extract-0.1u4", 
                revision: 4 
            },
            {
                id: "extract-0.1u6",
                revision: 6,
            },
            {
                id: "extract-0.1u5",
                revision: 5
            }
        ];
        expect(ZipService.getLatestApp(apps).revision).toEqual(6);
    });

    it("should check for a system ID and load a modal when asking the user to push keys", () => {
        let mockModal = {
            result: $q.resolve({})
        }
        let deferred = $q.defer();
        deferred.resolve({});
        spyOn(SystemsService, 'get').and.returnValue(deferred.promise);
        spyOn($uibModal, 'open').and.returnValue(mockModal);
        ZipService.pushKeysModal("test-system");
        $scope.$digest();
        expect(SystemsService.get).toHaveBeenCalled();
        expect($uibModal.open).toHaveBeenCalled();
    });

    it("should reject an error when asking the user to push keys", () => {
        let deferred = $q.defer();
        deferred.reject({});
        spyOn(SystemsService, 'get').and.returnValue(deferred.promise);
        spyOn($uibModal, 'open');
        ZipService.pushKeysModal("test-system");
        $scope.$digest();
        expect(SystemsService.get).toHaveBeenCalled();
        expect($uibModal.open).not.toHaveBeenCalled();
    });

    it("should re-attempt job submissions upon successfully pushing keys", () => {
        let deferred = $q.defer();
        deferred.resolve({});
        spyOn(ZipService, 'pushKeysModal').and.returnValue(deferred.promise);
        spyOn(ZipService, 'submitJobHelper');
        // Run pushKeysHelper and resolve promises
        ZipService.pushKeysHelper("systemId", "jobData");
        $scope.$digest();
        expect(ZipService.submitJobHelper).toHaveBeenCalled();
    });

    it("should not re-attempt job submissions if the user did not push keys", () => {
        let deferred = $q.defer();
        deferred.reject("error");
        spyOn(ZipService, 'pushKeysModal').and.returnValue(deferred.promise);
        spyOn(ZipService, 'submitJobHelper');
        ZipService.pushKeysHelper("some", "data");
        $scope.$digest();
        expect(ZipService.submitJobHelper).not.toHaveBeenCalled();
    });

    it("should return a job submission response", () => {
        let deferred = $q.defer();
        deferred.resolve("success");
        spyOn(Jobs, 'submit').and.returnValue(deferred.promise);
        let promiseResult = "";
        ZipService.submitJobHelper("some", "data").then(
            (result) => {
                promiseResult = result;
            }
        );
        $scope.$digest();
        expect(promiseResult).toEqual("success");
    });

    it("should ask the user to push keys when submitting a job", () => {
        let deferred = $q.defer();
        deferred.resolve(
            {
                execSys: {
                    id: "test-system"
                }
            }
        );
        spyOn(Jobs, 'submit').and.returnValue(deferred.promise);
        spyOn(ZipService, 'pushKeysHelper').and.returnValue($q.resolve({}));
        ZipService.submitJobHelper("jobData");
        $scope.$digest();
        expect(ZipService.pushKeysHelper).toHaveBeenCalledWith("test-system", "jobData");
    });

    it("should handle a rejection from the back end and call the pushKeysHelper", () => {
        let deferred = $q.defer();
        deferred.reject(
            {
                data: {
                    message: "Unable to authenticate to test.system with the default credential"
                }
            }
        );
        spyOn(Jobs, 'submit').and.returnValue(deferred.promise);
        spyOn(ZipService, 'pushKeysHelper').and.returnValue($q.resolve({}));
        ZipService.submitJobHelper("jobData");
        $scope.$digest();
        expect(ZipService.pushKeysHelper).toHaveBeenCalledWith("test.system", "jobData");
    });

    it("should submit a compress job", () => {
        ZipService.zippyAppId = "zippy-0.1u1";
        let files = [
            {"name": "file1.txt", "path": "/folder/file1.txt", "system": "test-system"},
            {"name": "file2.txt", "path" : "/folder/file2.txt", "system": "test-system"}
        ];
      
        let expectedJobData = { 
            allocation: "FORK",
            appId: "zippy-0.1u1",
            archive: true,
            archivePath: "agave://test-system/folder/",
            maxRunTime: "02:00:00",
            name: "Compressing Files",
            inputs: {
                inputFiles: [ 
                "agave://test-system/folder/file1.txt", 
                "agave://test-system/folder/file2.txt" 
                ]
            },
            parameters: {
                zipfileName: "zipfile.zip",
                filenames: '"file1.txt" "file2.txt" '
            }
        }
        spyOn(ZipService, 'submitJobHelper').and.returnValue($q.resolve({}));
        ZipService.submitCompressJob(files, "zipfile.zip", "zip");
        $scope.$digest();
        expect(ZipService.submitJobHelper).toHaveBeenCalledWith(expectedJobData);
    });

    it("should submit a compress job with a compressionType if targzSupport is enabled", () => {
        ZipService.zippyAppId = "zippy-0.1u1";
        ZipService.targzSupport = true;
        let files = [
            {"name": "file1.txt", "path": "/folder/file1.txt", "system": "test-system"},
            {"name": "file2.txt", "path" : "/folder/file2.txt", "system": "test-system"}
        ];
      
        let expectedJobData = { 
            allocation: "FORK",
            appId: "zippy-0.1u1",
            archive: true,
            archivePath: "agave://test-system/folder/",
            maxRunTime: "02:00:00",
            name: "Compressing Files",
            inputs: {
                inputFiles: [ 
                "agave://test-system/folder/file1.txt", 
                "agave://test-system/folder/file2.txt" 
                ]
            },
            parameters: {
                zipfileName: "zipfile.zip",
                filenames: '"file1.txt" "file2.txt" ',
                compression_type: "zip"
            }
        }
        spyOn(ZipService, 'submitJobHelper').and.returnValue($q.resolve({}));
        ZipService.submitCompressJob(files, "zipfile.zip", "zip");
        $scope.$digest();
        expect(ZipService.submitJobHelper).toHaveBeenCalledWith(expectedJobData);
    });

    it("should submit an extract job ", () => {
        ZipService.extractAppId = "extract-0.1u1";
        let files = [ 
            { "name" : "file.zip", "path": "/folder/file.zip", "system": "test-system" }
        ];
        let expectedJobData = {
            allocation: "FORK",
            appId: "extract-0.1u1",
            archive: true,
            archivePath: "agave://test-system/folder/",
            inputs: {
                inputFile: "agave://test-system/folder/file.zip"
            },
            maxRunTime: "02:00:00",
            name: "Extracting Zip File",
            parameters: { }
        }
        spyOn(ZipService, 'submitJobHelper').and.returnValue($q.resolve({}));
        ZipService.submitExtractJob(files);
        $scope.$digest();
        expect(ZipService.submitJobHelper).toHaveBeenCalledWith(expectedJobData);
    });

    it("should load a modal and submit a compress job", () => {
        let mockModal = {
            result: $q.resolve({ destination: "file.zip", compressionType: "zip" }),
        };
        spyOn($uibModal, 'open').and.returnValue(mockModal)
        spyOn(ZipService, 'submitCompressJob').and.returnValue($q.resolve({}));
        ZipService.compress("files");
        $scope.$digest();
        expect(ZipService.submitCompressJob).toHaveBeenCalledWith("files", "file.zip", "zip");
    });

    it("should return success when compressing files", () => {
        let mockModal = {
            result: $q.resolve({ destination: "file.zip", compressionType: "zip" })
        };
        spyOn($uibModal, 'open').and.returnValue(mockModal);
        spyOn(ZipService, 'submitCompressJob').and.returnValue($q.resolve("success"));
        spyOn($mdToast, 'show');
        let promise = ZipService.compress("files");
        promise.then(
            (result) => {
                expect(result).toEqual("success");
            }
        )
        $scope.$digest();
    });

    it("should toast failure when compressing files", () => {
        let mockModal = {
            result: $q.resolve({ destination: "file.zip", compressionType: "zip" })
        };
        spyOn($uibModal, 'open').and.returnValue(mockModal);
        spyOn(ZipService, 'submitCompressJob').and.returnValue($q.reject({}));
        spyOn($mdToast, 'show');
        ZipService.compress("files");
        $scope.$digest();
        expect($mdToast.show).toHaveBeenCalled();
    });

    it("should submit an extraction job", () => {
        spyOn(ZipService, 'submitExtractJob').and.returnValue($q.resolve());
        ZipService.extract("files");
        $scope.$digest();
        expect(ZipService.submitExtractJob).toHaveBeenCalledWith("files");
    });

    it("should return success on submission of an extraction job", () => {
        spyOn(ZipService, 'submitExtractJob').and.returnValue($q.resolve("success"));
        spyOn($mdToast, 'show');
        let promise = ZipService.extract("files");
        promise.then(
            (result) => {
                expect(result).toEqual("success");
            }
        )
        $scope.$digest();
    });

    it("should toast on failure of submission of an extraction job", () => {
        spyOn(ZipService, 'submitExtractJob').and.returnValue($q.reject({ }));
        spyOn($mdToast, 'show');
        ZipService.extract("files");
        $scope.$digest();
        expect($mdToast.show).toHaveBeenCalled(); 
    });
});