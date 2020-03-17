import angular from 'angular';
import $ from 'jquery';

class DataBrowserService {
    constructor($rootScope, $http, $q, $timeout, $uibModal, $state,
        $translate, $mdToast, UserService, FileListing) {
        'ngInject';

        this.$rootScope = $rootScope;
        this.$http = $http;
        this.$q = $q;
        this.$timeout = $timeout;
        this.$uibModal = $uibModal;
        this.$state = $state;
        this.$translate = $translate;
        this.$mdToast = $mdToast;
        this.UserService = UserService;
        this.FileListing = FileListing;

        this.currentState = {
            busy: false,
            busyListing: false,
            loadingMore: false,
            error: null,
            listing: null,
            selected: [],
            reachedEnd: false,
            page: 0,
            showMainListing: true,
            showPreviewListing: false,
            ui: {
                message: {}
            }
        };

        this.apiParams = {
            fileMgr: 'my-data',
            baseUrl: '/api/data-depot/files'
        };

        this.toolbarOpts = {};
        this.currentBrowseRequest = null;
        /**
         * Enumeration of event `DataBrowserService::Event` types
         *
         * @readonly
         * @enum {string}
         */
        this.FileEvents = {
            FILE_ADDED: 'FileAdded',
            FILE_COPIED: 'FileCopied',
            FILE_MOVED: 'FileMoved',
            FILE_REMOVED: 'FileRemoved',
            FILE_SELECTION: 'FileSelection',
            FILE_META_UPDATED: 'MetadataUpdated'
        };

        /**
         * Enumeration of event `DataBrowserService::EventMessage` strings
         *
         * @readonly
         * @enum {string}
         */
        this.FileEventsMsg = {
            FILE_ADDED: 'Your file was added.',
            FILE_COPIED: 'Your file was copied.',
            FILE_MOVED: 'Your file was moved.',
            FILE_REMOVED: 'Your file was removed.',
            FILE_SELECTION: 'Your file has been selected.',
            FILE_META_UPDATED: 'Metadata object updated.',
        };
    }

    // TODO figure out how to make this more programmatic. Just hacking for now.
    toolbarOptions() {
        this.$http.get('/api/data-depot/toolbar/params')
            .then( (resp) => {
                var toolbarOpts = {
                    trash_enabled: resp.data.response.trash_enabled,
                    share_enabled: resp.data.response.share_enabled,
                    preview_enabled: resp.data.response.preview_enabled,
                    preview_images_enabled: resp.data.response.preview_images_enabled,
                    copy_enabled: resp.data.response.copy_enabled,
                    move_enabled: resp.data.response.move_enabled,
                    rename_enabled: resp.data.response.rename_enabled,
                    tag_enabled: resp.data.response.tag_enabled
                };
                return toolbarOpts;
            },
                (error) => {
                    return this.$q.reject(error);
                });
    }
    
    /**
    *
    * @param {FileListing[]} files FileListing objects to select
    * @param {boolean} [reset] If true, clears current selection before selecting the passed files.
    */
    select(files, reset) {
        if (reset) {
            this.deselect(this.currentState.selected);
        }
        files.forEach( (f) => {
            f._ui = f._ui || {};
            f._ui.selected = true;
        });
        const fileSet = new Set([...this.currentState.selected, ...files]);
        this.currentState.selected = [...fileSet];
        this.notify(this.FileEvents.FILE_SELECTION, this.FileEventsMsg.FILE_SELECTION,
            this.currentState.selected);
    }
    /**
    *
    * @param {FileListing[]} files FileListing objects to de-select
    */
    deselect(files) {
        files.forEach( (f) => {
            f._ui = f._ui || {};
            f._ui.selected = false;
        });
        this.currentState.selected = this.currentState.selected.filter( (x) => !files.includes(x));
        this.notify(this.FileEvents.FILE_SELECTION, this.FileEventsMsg.FILE_SELECTION,
            this.currentState.selected);
    }

    /**
    * Tests for the DataBrowser actions allowed on the given file(s) from the current listing.
    *
    * @param {FileListing|FileListing[]} files Files to test
    * @return {{canDownload: {boolean}, canPreview: {boolean}, canViewMetadata: {boolean}, canShare: {boolean}, canCopy: {boolean}, canMove: {boolean}, canRename: {boolean}, canTrash: {boolean}, canDelete: {boolean}}}
    */
    allowedActions(files) {
        if (!Array.isArray(files)) {
            files = [files];
        }
        var tests = {};
        tests.canDownload = files.length >= 1 && this.hasPermission('READ', files) && !this.containsFolder(files);
        tests.canPreview = files.length === 1 && this.hasPermission('READ', files) && !this.containsFolder(files);
        tests.canPreviewImages = files.length >= 1 && this.hasPermission('READ', files);
        tests.canViewMetadata = files.length >= 1 && this.hasPermission('READ', files);
        tests.canShare = files.length === 1 && this.$state.current.name === 'myData';
        tests.canCopy = files.length >= 1 && this.hasPermission('READ', files) && this.UserService.currentUser.username;
        tests.canMove = files.length >= 1 && this.hasPermission('WRITE', [this.currentState.listing].concat(files)) && (this.apiParams.fileMgr !== 'shared') && (this.apiParams.fileMgr !== 'public') && (this.apiParams.directory !== 'external-resources');
        tests.canRename = files.length === 1 && this.hasPermission('WRITE', [this.currentState.listing].concat(files)) && (this.apiParams.fileMgr !== 'shared') && (this.apiParams.fileMgr !== 'public') && (this.apiParams.directory !== 'external-resources');
        tests.canViewCategories = files.length >= 1 && this.hasPermission('WRITE', files);
        tests.canCompress =
            files.length >= 1 &&
            !(files.length == 1 && (files[0].name.endsWith(".zip") || files[0].name.endsWith(".tar.gz"))) &&
            this.hasPermission('WRITE', [this.currentState.listing].concat(files)) &&
            (this.apiParams.fileMgr !== 'shared') &&
            (this.apiParams.fileMgr !== 'public') &&
            (this.apiParams.directory !== 'external-resources');
        tests.canExtract =
            files.length === 1 &&
            this.hasPermission('WRITE', [this.currentState.listing].concat(files)) &&
            (files[0].name.endsWith(".zip") || files[0].name.endsWith(".tar.gz")) &&
            (this.apiParams.fileMgr !== 'shared') &&
            (this.apiParams.fileMgr !== 'public') &&
            (this.apiParams.directory !== 'external-resources');;

        tests.canTrash = this.canTrash(this.$state.current.name, files);

        let trashPath = this._trashPath();
        tests.canDelete = this.$state.current.name === 'wb.data_depot.db' && files.length >= 1 && this.currentState.listing.path === trashPath && (this.apiParams.fileMgr !== 'shared');

        return tests;
    }

    canTrash(stateName, files) {
        if (!this.currentState.listing) {
            return false;
        }
        let notTrashPath = this.currentState.listing.path !== this._trashPath();
        let stateNameValid = stateName === 'wb.data_depot.db'
            || stateName === 'db.projects.view.data'
            || stateName === 'wb.data_depot.projects.listing';
        let hasFiles = files.length >= 1;
        let notProtected = !files.some( (sel) => { return this.isProtected(sel); });
        let canWrite = this.hasPermission('WRITE', [this.currentState.listing]);
        let notShared = this.apiParams.fileMgr !== 'shared';
        let notPublic = this.apiParams.fileMgr !== 'public';
        return this.currentState.listing
            && stateNameValid
            && hasFiles
            && notTrashPath
            && notProtected
            && notShared
            && notPublic
            && canWrite;
    }

    showListing() {
        this.currentState.showMainListing = true;
        this.currentState.showPreviewListing = false;
    }

    showPreview() {
        this.currentState.showMainListing = false;
        this.currentState.showPreviewListing = true;
    }

    /**
    *
    * @param options
    * @param options.system
    * @param options.path
    */
    browse(options) {
        // debugger
        if (this.currentBrowseRequest) {
            this.currentBrowseRequest.stopper.resolve();
            this.currentBrowseRequest = null;
            // $timeout.cancel(currentBrowseRequest);
        }

        this.currentState.busy = true;
        this.currentState.busyListing = true;
        this.currentState.error = null;
        //this.currentState.loadingMore = true;
        this.currentState.reachedEnd = false;
        this.currentState.busyListingPage = false;
        this.currentState.page = 0;
        this.currentBrowseRequest = this.FileListing.get(options, this.apiParams, {
            queryString: options.queryString,
            system: options.system,
            offset: options.offset,
            limit: options.limit
        });

        this.currentBrowseRequest.then( (listing) => {
            this.select([], true);
            this.currentState.busy = false;
            this.currentState.busyListing = false;
            //this.currentState.loadingMore = false;
            this.currentState.reachedEnd = false;
            this.currentState.listing = listing;
            if (listing.children.length < options.limit) {
                this.currentState.reachedEnd = true
            }
            return listing;
        }, (err) => {
            // This is for a cancelled promise...
            if (err.status == -1) {
                this.currentState.busyListing = true;
                this.currentState.busy = true;
            } else {
                this.currentState.busy = false;
                this.currentState.busyListing = false;
            }
            this.currentState.listing = null;
            this.currentState.error = err.data;
            this.currentState.error.status = err.status;
            //this.currentState.loadingMore = false;
            this.currentState.reachedEnd = false;
            return err;
        });
        return this.currentBrowseRequest;
    }

    /**
    *
    * @param options
    * @param options.system
    * @param options.path
    * @param options.page
    */
    browsePage(options) {
        //this.currentState.busy = true;
        this.currentState.busyListingPage = true;
        this.currentState.error = null;
        var limit = options.limit;
        var offset = options.offset;
        if (options.page) {
            offset += limit * options.page;
        }
        var params = { limit: limit, offset: offset, queryString: options.queryString };
        return this.FileListing.get(options, this.apiParams, params).then( (listing) => {
            this.select([], true);
            //this.currentState.busy = false;
            this.currentState.busyListingPage = false;
            this.currentState.listing.children = this.currentState.listing.children.concat(listing.children);
            return listing;
        }, (err) => {
            //this.currentState.busy = false;
            this.currentState.busyListingPage = false;
            return err
        });
    }

    /**
    *
    * @param {FileListing|FileListing[]} files
    * @return {*}
    */
    copy(files) {
        if (!Array.isArray(files)) {
            files = [files];
        }

        var modal = this.$uibModal.open({
            component: 'modalMoveCopyComponent',
            resolve: {
                files: () => { return files; },
                action: () => { return 'COPY'; }
            }
        });

        return modal.result.then( (result) => {
            this.$mdToast.show(this.$mdToast.simple()
                        .content(this.$translate.instant('info_copy_file'))
                        .toastClass('into')
                        .parent($("#toast-container")));
            var copyPromises = files.map( (f) => {

                return f.copy({ system: result.target.system, path: result.target.path, resource: result.target.resource }).then( (result) => {
                    //notify(FileEvents.FILE_COPIED, FileEventsMsg.FILE_COPIED, f);
                    this.currentState.busy = false;
                    this.$mdToast.show(this.$mdToast.simple()
                        .content(this.$translate.instant('success_copy_file'))
                        .toastClass('success')
                        .parent($("#toast-container")));
                    return result;
                }, (err) => {
                    this.$mdToast.show(this.$mdToast.simple()
                        .content(this.$translate.instant('error_copy_file'))
                        .toastClass('error')
                        .parent($("#toast-container")));
                    return this.$q.reject(err.data);
                });
            });
            return this.$q.all(copyPromises).then( (results) => {
                this.browse(this.currentState.listing);
                return results;
            });
        }
        );
    }

    /**
    * Download files. Returns a promise that is resolved when all downloads have been
    * _started_. Resolved with the download URL for each file.
    *
    * @param {FileListing|FileListing[]} files
    * @return {Promise}
    */
    download(files) {
        this.currentState.busy = true;
        if (!Array.isArray(files)) {
            files = [files];
        }
        var download_promises = files.map( (file) => {
            return file.download().then( (resp) => {
                // TODO: This opens each download in a new tab
                // and closes once the download is started. We
                // need to zip these selected files and download
                // them as one file...
                var link = document.createElement('a');
                link.style.display = 'none';
                link.setAttribute('href', resp.response.href);
                link.setAttribute('type', resp.response.fileType);
                link.setAttribute('target', "_blank");
                link.setAttribute('download', 'null');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                this.currentState.busy = false;
                return resp;
            });
        });

        return this.$q.all(download_promises);
    }

    /**
    * TODO
    *
    * @returns {*}
    */
    getFileManagers() {
        return this.$http.get('/api/files/file-managers/').then( (resp) => {
            return resp.data;
        });
    }

    /**
    *
    * @param {FileListing|FileListing[]} files
    */
    containsFolder(files) {
        if (!Array.isArray(files)) {
            files = [files];
        }

        let folders = files.filter((f) => { return ['dir', 'folder'].includes(f.type); });
        return (folders.length > 0);
    }

    /**
    *
    * @param {string} permission
    * @param {FileListing|FileListing[]} files
    */
    hasPermission(permission, files) {
        if (!Array.isArray(files)) {
            files = [files];
        }
        return files.reduce( (memo, file) => {
            var pem = file.permissions === 'ALL' || file.permissions.indexOf(permission) > -1;
            if (memo !== null) {
                pem = memo && pem;
            }
            return pem;
        }, null);
    }

    /**
    * This is not a great implementation, need to be more extensible...
    * @param {FileListing} file
    */
    isProtected(file) {
        if (file.system === 'designsafe.storage.default') {
            if (file.trail.length === 3 && file.name === '.Trash') {
                return true;
            }
        }
        return false;
    }

    /**
    * Create a directory in the current listing directory.
    *
    * @returns {Promise}
    */
    mkdir() {
        var modal = this.$uibModal.open({
            component: 'modalMakeDirComponent'
        });

        return modal.result.then( (folderName) => {
            this.currentState.busy = true;
            this.currentState.listing.mkdir({
                name: folderName
            }).then( (newDir) => {
                this.currentState.busy = false;
                //notify(FileEvents.FILE_ADDED, FileEventsMsg.FILE_ADDED, newDir);
                this.$mdToast.show(this.$mdToast.simple()
                    .content(this.$translate.instant('success_mkdir'))
                    .toastClass('success')
                    .parent($("#toast-container")));
            }, (err) => {
                // TODO better error handling
                this.currentState.busy = false;
                this.$mdToast.show(this.$mdToast.simple()
                    .content(this.$translate.instant('error_mkdir'))
                    .toastClass('error')
                    .parent($("#toast-container")));
                return this.$q.reject(err.data);
            });
        });
    }

    /**
    *
    * @param {FileListing|FileListing[]} files
    * @param {FileListing} initialDestination
    * @returns {Promise}
    */
    move(files, initialDestination) {
        if (!Array.isArray(files)) {
            files = [files];
        }

        var modal = this.$uibModal.open({
            component: 'modalMoveCopyComponent',
            resolve: {
                files: () => { return files; },
                action: () => { return 'MOVE'; }
            }
        });
        return modal.result.then( (result) => {
                //if (result.system !== files[0].system){
                //  return $q.when(files);
                //}
                this.$mdToast.show(this.$mdToast.simple()
                            .content(this.$translate.instant('info_move_file'))
                            .toastClass('info')
                            .parent($("#toast-container")));
                var movePromises = files.map( (f) => {
                    return f.move({ system: result.target.system, path: result.target.path }).then( (result) => {
                        this.deselect([f]);
                        //notify(FileEvents.FILE_MOVED, FileEventsMsg.FILE_MOVED, f);
                        this.$mdToast.show(this.$mdToast.simple()
                            .content(this.$translate.instant('success_move_file'))
                            .toastClass('success')
                            .parent($("#toast-container")));
                        this.currentState.busy = false;
                        return result;
                    }, (err) => {
                        this.currentState.busy = false;
                        this.$mdToast.show(this.$mdToast.simple()
                            .content(this.$translate.instant('error_move_file'))
                            .toastClass('error')
                            .parent($("#toast-container")));
                        return this.$q.reject(err.data);
                    });
                });
                return this.$q.all(movePromises).then( (results) =>{
                    this.currentState.busy = false;
                    return results;
                });
            }
        );
    }

    /**
    *
    * @param {FileListing} file
    * @return {Promise}
    */
    preview(file, listing) {
        var modal = this.$uibModal.open({
            component: 'modalPreviewComponent',
            size: 'lg',
            resolve: {
                file: file,
                listing: this.currentState.listing,
            }
        });
    }

    publicUrl(file) {
        var modal = this.$uibModal.open({
            component: 'modalPublicUrlComponent',
            size: 'lg',
            resolve: {
                file: file,
            }
        });
    }

    /**
    *
    * @param {FileListing} file
    * @return {Promise}
    */
    rename(file) {
        var modal = this.$uibModal.open({
            component: 'modalRenameComponent',
            resolve: {
                file: file
            }
        });

        return modal.result.then( (result) => {
            this.currentState.busy = true;
            return result.file.rename({ name: result.renameTo })
                .then(
                    (result) => {
                        this.currentState.busy = false;
                        this.$mdToast.show(this.$mdToast.simple()
                            .content(this.$translate.instant('success_rename_file'))
                            .toastClass('success')
                            .parent($("#toast-container")));
                    },
                    (err) => {
                        this.currentState.busy = false;
                        this.$mdToast.show(this.$mdToast.simple()
                            .content(this.$translate.instant('error_rename_file'))
                            .toastClass('error')
                            .parent($("#toast-container")));
                        return this.$q.reject(err.data);
                    }
                );
        });
    }

    /**
    * TODO
    *
    * @param options
    */
    search(options) {
        this.currentState.busy = true;
        this.currentState.busyListing = true;
        this.currentState.error = null;
        return this.FileListing.search(options, this.apiParams).then( (listing) => {
            select([], true);
            this.currentState.busy = false;
            this.currentState.busyListing = false;
            this.currentState.listing = listing;
            return listing;
        }, (err) => {
            this.currentState.busy = false;
            this.currentState.busyListing = false;
            this.currentState.listing = null;
            this.currentState.error = err.data;
        });
    }

    /**
    *
    * @param {FileListing|FileListing[]} files The files to move to Trash
    * @return {Promise} A promise that is resolved with the trashed files when _all_ files have been
    * successfully Trashed.
    */
    trash(files) {
        if (!Array.isArray(files)) {
            files = [files];
        }

        this.$mdToast.show(this.$mdToast.simple()
                .content(this.$translate.instant('info_trash_file'))
                .toastClass('info')
                .parent($("#toast-container")));
        var trashPromises = files.map( (file) => {
            return file.trash().then( (trashed) => {
                //notify(FileEvents.FILE_MOVED, FileEventsMsg.FILE_MOVED, trashed);
                return trashed;
            });
        });
        return this.$q.all(trashPromises).then( (val) => {
            this.browse(this.currentState.listing);

            this.$mdToast.show(this.$mdToast.simple()
                .content(this.$translate.instant('success_trash_file'))
                .toastClass('success')
                .parent($("#toast-container")));
            return val;
        }, (err) => {
            this.currentState.busy = false;
            this.$mdToast.show(this.$mdToast.simple()
                .content(this.$translate.instant('error_trash_file'))
                .toastClass('error')
                .parent($("#toast-container")));
            return this.$q.reject(err.data);
        });
    }

    _trashPath() {
        if (this.currentState.listing && this.currentState.listing.system) {
            switch (this.currentState.listing.system) {
                case 'designsafe.storage.default':
                    return ['', this.UserService.currentUser.username, '.Trash'].join('/');
                case 'designsafe.storage.projects':
                    var projectDir = this.currentState.listing.path.split('/')[1];
                    return ['', projectDir, '.Trash'].join('/');
                default:
                    return undefined;
            }
        }
        return undefined;
    }

    /**
    * Upload files or folders to the currently listed destination
    *
    * @param {boolean} directoryUpload
    * @param {FileList} [files] Initial selected file(s) to upload
    */
    upload(directoryUpload, files) {
        var modal = this.$uibModal.open({
            component: 'modalUploadComponent',
            size: 'lg',
            resolve: {
                directoryUpload: directoryUpload,
                destination: this.currentState.listing,
                files: files,
                currentState: this.currentState,
            }
        });
    }

    /**
    * @callback subscribeCallback
    * @param {object} $event
    * @param {object} eventData
    * @param {FileEvents} eventData.type
    * @param {object} eventData.context
    */
    /**
    *
    * @param {object} scope
    * @param {subscribeCallback} callback
    */
    subscribe(scope, callback) {
        var handler = this.$rootScope.$on('DataBrowserService::Event', callback);
        scope.$on('$destroy', handler);
    }

    /**
    *
    * @param {FileEvents} eventType The event
    * @param {object} eventContext The object/context of the event. The value of this parameter depends on the `eventType`
    */
    notify(eventType, eventMsg, eventContext) {
        this.$rootScope.$emit('DataBrowserService::Event', {
            type: eventType,
            context: eventContext,
            msg: eventMsg
        });
    }

    scrollToTop() {
        return;
    }

    scrollToBottom(options) {
        if (this.currentState.loadingMore || this.currentState.reachedEnd) {
            return;
        }
        if (this.currentState.listing && this.currentState.listing.children &&
            this.currentState.listing.children.length < options.limit) {
            this.currentState.reachedEnd = true;
            return;
        }
        this.currentState.page += 1;
        this.currentState.loadingMore = true;
        this.browsePage({
            system: this.currentState.listing.system,
            path: this.currentState.listing.path,
            page: this.currentState.page,
            queryString: options.queryString,
            offset: options.offset,
            limit: options.limit
        }).then( (listing) => {
            this.currentState.loadingMore = false;
            if (listing.children.length < options.limit) {
                this.currentState.reachedEnd = true;
            }
        }, (err) => {
            this.currentState.loadingMore = false;
            this.currentState.reachedEnd = true;
            this.currentState.error.message = err.data;
            this.currentState.error.status = err.status;
        });
    }

}

export default DataBrowserService;
