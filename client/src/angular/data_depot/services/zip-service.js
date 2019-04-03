class ZipService {
    constructor(Jobs, SystemsService, $mdToast, $q, $uibModal, Apps) {
        'ngInject';

        this.Jobs = Jobs;
        this.SystemsService = SystemsService;
        this.$mdToast = $mdToast;
        this.$q = $q;
        this.$uibModal = $uibModal;

        this.compressing = false;
        this.extracting = false;
        this.Apps = Apps;

        // have the necessary apps and the buttons will not show
        // in the data depot toolbar
        this.zippyAppId = null;
        this.extractAppId = null;
        this.init();
    }

    getLatestApp(apps) {
        let latest = apps[0];
        apps.forEach(
            (app) => {
                if (app.revision > latest.revision) {
                    latest = app;
                }
            }
        )
        return latest;
    }

    init() {
        this.Apps.getPublic().then(
            (response) => {
                let publicApps = response.data.response;

                // Look for apps matching zippy-x.yuz
                let zippyApps = publicApps.filter(
                    (app) => {
                        return app.id.match(/zippy-\d.\du\d/g);
                    }
                )
                // Find id of latest revision of zippy apps
                this.zippyAppId = this.getLatestApp(zippyApps).id;

                let extractApps = publicApps.filter(
                    (app) => {
                        return app.id.match(/extract-\d.\du\d/g);
                    }
                )
                this.extractAppId = this.getLatestApp(extractApps).id;
            }
        );
    }

    getWorkingDirectory(file) {
        return "agave://" + file.system + 
            file.path.substring(0, file.path.lastIndexOf("/") + 1);
    }
    
    getAgaveName(file) {
        return "agave://" + file.system + file.path;
    }
    
    pushKeysModal(systemId) {
        // Open the SystemPushKeysModal for the user
        // and return a promise for the user being successful
        return this.SystemsService.get(systemId).then(
        (sys) => {
            return this.$uibModal.open({
                component: 'SystemPushKeysModal',
                resolve: {
                    sys: () => {
                        return sys;
                    },
                },
            }).result;
        }, 
        (err) => {
            return this.$q.reject(err);
        }
        );
    }
    
    pushKeysHelper(systemId, jobData) {
        // Helper function to retry jobs submission after pushing keys
        return this.pushKeysModal(systemId).then(
            (result) => {
            // Recursively retry the job submission
                return this.submitJobHelper(jobData);
            },
            (error) => {
                // Return an error if the user was unable to
                // push keys. This should unwrap any recursion
                // from retries.
                return this.$q.reject(error);
            }
        )
    }
    
    submitJobHelper(jobData) {
        // Create a helper function to run Jobs.submit
        // and handle when the private exec system for these apps
        // does not have keys pushed
        return this.Jobs.submit(jobData).then(
            (resp) => {
                // The CLI app may require creation of
                // a copy of the community execution system, and
                // the user must push keys to it.
                let sysNeedsKeys = resp.execSys;
                if (sysNeedsKeys) {
                    // If pushing keys was required, bring up the modal
                    return this.pushKeysHelper(sysNeedsKeys.id, jobData);
                }
                // Job submission was successful without
                // user intervention
                return resp;
            },
            (error) => {
                // Handle status 412 - personal exec system exists but doesn't have correct keys
                let clonedSysId = error.data.message.match(
                    'Unable to authenticate to (.*) with the default credential'
                )[1];
                // Bring up the push keys modal
                return this.pushKeysHelper(clonedSysId, jobData);
            }
        ) 
    }
    
    submitCompressJob(files, destination) {
        let inputFiles = [ ];
        let filenames = "";
    
        files.forEach(
          (file) => {
            inputFiles.push(this.getAgaveName(file));
            filenames += '"' + file.name + '" '
          }
        )
    
        let workingDirectory = this.getWorkingDirectory(files[0]);
    
        let jobData = { 
            allocation: "FORK",
            appId: this.zippyAppId,
            archive: true,
            archivePath: workingDirectory,
            maxRunTime: "02:00:00",
            name: "Compressing Files",
            inputs: {
                inputFiles: inputFiles
            },
            parameters: {
                zipfileName: destination,
                filenames: filenames
            }
        }
    
        return this.submitJobHelper(jobData);
    }
    
    submitExtractJob(files) {
        let jobData = { 
            allocation: "FORK",
            appId: this.extractAppId,
            archive: true,
            archivePath: this.getWorkingDirectory(files[0]),
            inputs: {
                inputFile: this.getAgaveName(files[0])
            },
            maxRunTime: "02:00:00",
            name: "Extracting Zip File",
            parameters: { }
        };
        
        return this.submitJobHelper(jobData);
    }
    
    compress(files) {
        var modal = this.$uibModal.open({
          component: 'modalCompressComponent',
        });
    
        return modal.result.then( 
            (result)=> {
                this.compressing = true;
                return this.submitCompressJob(files, result.destination);
            }
        ).then(
            (result) => {
                return result;
            },
            (error) => {
                return this.$mdToast.show(
                    this.$mdToast.simple()
                        .content("There was an error compressing your files")
                        .toastClass('error')
                        .parent($("#toast-container"))
                );
            }
        ).finally(
            () => {
                this.compressing = false;
            }
        );
    }
    
    extract(files) {
        this.extracting = true;
        return this.submitExtractJob(files).then(
            (result) => {
                return result;
            },
            (error) => {
                return this.$mdToast.show(
                    this.$mdToast.simple()
                        .content("There was an error unzipping your files")
                        .toastClass('error')
                        .parent($("#toast-container"))
                );
            }
        ).finally(
            () => {
                this.extracting = false;
            }
        )
    }
}

export default ZipService;