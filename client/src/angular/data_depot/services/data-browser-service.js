function DataBrowserService($rootScope, $http, $q, $timeout, $uibModal, $state, Django, FileListing) {
  'ngInject';

  /**
   * @type {{busy: boolean, listing: FileListing, selected: Array}}
   */
  var currentState = {
    busy: false,
    busyListing: false,
    error: null,
    listing: null,
    selected: [],
    loadingMore: false,
    reachedEnd: false,
    page: 0,
    showMainListing: true,
    showPreviewListing: false,
    ui: {}
  };

  var apiParams = {
    fileMgr : 'agave',
    baseUrl : '/api/files'
  };

  var toolbarOpts = {};
  var currentBrowseRequest = null;
  /**
   * Enumeration of event `DataBrowserService::Event` types
   *
   * @readonly
   * @enum {string}
   */
  var FileEvents = {
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
  var FileEventsMsg = {
    FILE_ADDED: 'Your file was added.',
    FILE_COPIED: 'Your file was copied.',
    FILE_MOVED: 'Your file was moved.',
    FILE_REMOVED: 'Your file was remove.',
    FILE_SELECTION: 'Your file has been selected.',
    FILE_META_UPDATED: 'Metadata object updated.',
  };

  // TODO figure out how to make this more programmatic. Just hacking for now.
  function toolbarOptions() {
    $http.get('/api/data-depot/toolbar/params')
      .then(function(resp) {
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
        function(error) {
          console.log('$http.get Error', error);
        });
  }

  /**
   * Gets the apiParams of the DataBrowserService.
   */
  function apiParameters(){
    return apiParams;
  }

  /**
   * Gets the state of the DataBrowserService.
   *
   * @return {{busy: boolean, listing: FileListing, selected: Array}}
   */
  function state() {
    return currentState;
  }


  /**
   *
   * @param {FileListing[]} files FileListing objects to select
   * @param {boolean} [reset] If true, clears current selection before selecting the passed files.
   */
  function select(files, reset) {
    if (reset) {
      deselect(currentState.selected);
    }
    _.each(files, function(f) {
      f._ui = f._ui || {};
      f._ui.selected = true;
    });
    currentState.selected = _.union(currentState.selected, files);
    notify(FileEvents.FILE_SELECTION, FileEventsMsg.FILE_SELECTION,
           currentState.selected);
  }


  /**
   *
   * @param {FileListing[]} files FileListing objects to de-select
   */
  function deselect(files) {
    _.each(files, function(f) {
      f._ui = f._ui || {};
      f._ui.selected = false;
    });
    currentState.selected = _.difference(currentState.selected, files);
    notify(FileEvents.FILE_SELECTION, FileEventsMsg.FILE_SELECTION,
           currentState.selected);
  }


  /**
   * Tests for the DataBrowser actions allowed on the given file(s) from the current listing.
   *
   * @param {FileListing|FileListing[]} files Files to test
   * @return {{canDownload: {boolean}, canPreview: {boolean}, canViewMetadata: {boolean}, canShare: {boolean}, canCopy: {boolean}, canMove: {boolean}, canRename: {boolean}, canTrash: {boolean}, canDelete: {boolean}}}
   */
  function allowedActions (files) {
    if (! Array.isArray(files)) {
      files = [files];
    }
    var tests = {};
    tests.canDownload = files.length >= 1 && hasPermission('READ', files) && !containsFolder(files);
    tests.canPreview = files.length === 1 && hasPermission('READ', files);
    tests.canPreviewImages = files.length >= 1 && hasPermission('READ', files);
    tests.canViewMetadata = files.length >= 1 && hasPermission('READ', files);
    tests.canShare = files.length === 1 && $state.current.name === 'myData';
    tests.canCopy = files.length >= 1 && hasPermission('READ', files);
    tests.canMove = files.length >= 1 && hasPermission('WRITE', [currentState.listing].concat(files)) && ($state.current.name !== 'dropboxData' && $state.current.name !== 'boxData');
    tests.canRename = files.length === 1 && hasPermission('WRITE', [currentState.listing].concat(files));
    tests.canViewCategories = files.length >=1 && hasPermission('WRITE', files);

    var trashPath = _trashPath();
    tests.canTrash = ($state.current.name === 'db.myData' || $state.current.name === 'db.projects.view.data') && files.length >= 1 && currentState.listing.path !== trashPath && ! _.some(files, function(sel) { return isProtected(sel); });
    tests.canDelete = $state.current.name === 'db.myData' && files.length >= 1 && currentState.listing.path === trashPath;

    return tests;
  }

  function showListing(){
    currentState.showMainListing = true;
    currentState.showPreviewListing = false;
  }

  function showPreview(){
    currentState.showMainListing = false;
    currentState.showPreviewListing = true;
  }

  /**
  *
  * @param options
  * @param options.system
  * @param options.path
  */
  function browse (options) {
    // debugger
    if (currentBrowseRequest) {
      currentBrowseRequest.stopper.resolve();
      currentBrowseRequest = null;
      // $timeout.cancel(currentBrowseRequest);
    }

    currentState.busy = true;
    currentState.busyListing = true;
    currentState.error = null;
    currentState.loadingMore = true;
    currentState.reachedEnd = false;
    currentState.busyListingPage = false;
    currentState.page = 0;
    currentBrowseRequest =  FileListing.get(options, apiParams);
    console.log('options DBS-------------------------------->');
    console.log(options);
    console.log('apiParams DBS-------------------------------->');
    console.log(apiParams);

    currentBrowseRequest.then(function (listing) {
      select([], true);
      console.log('listing DBS-------------------------------->');
      console.log(listing);
      currentState.busy = false;
      currentState.busyListing = false;
      currentState.loadingMore = false;
      currentState.reachedEnd = false;
      currentState.listing = listing;
      return listing;
    }, function (err) {
      // This is for a cancelled promise...
      if (err.status == -1) {
        currentState.busyListing = true;
        currentState.busy = true;
      } else {
        currentState.busy = false;
        currentState.busyListing = false;
      }
      currentState.listing = null;
      currentState.error = err;
      currentState.loadingMore = false;
      currentState.reachedEnd = false;
      return err;
    });
    return currentBrowseRequest;
  }

  /**
   *
   * @param options
   * @param options.system
   * @param options.path
   * @param options.page
   */
  function browsePage (options) {
    currentState.busy = true;
    currentState.busyListingPage = true;
    currentState.error = null;
    var limit = 100;
    var offset = 0;
    if (options.page){
      offset += limit * options.page;
    }
    var params = {limit: limit, offset: offset};
    return FileListing.get(options, apiParams, params).then(function (listing) {
      select([], true);
      currentState.busy = false;
      currentState.busyListingPage = false;
      currentState.listing.children = currentState.listing.children.concat(listing.children);
      return listing;
    }, function (err) {
      currentState.busy = false;
      currentState.busyListingPage = false;
    });
  }


  /**
   *
   * @param {FileListing|FileListing[]} files
   * @return {*}
   */
  function copy (files) {
    if (! Array.isArray(files)) {
      files = [files];
    }

    var modal = $uibModal.open({
      templateUrl: '/static/portal/scripts/angular/data_depot/modals/data-browser-service-copy.html',
      controller: 'ModalMoveCopy',
      resolve: {
        data: {
          files: function () {return files;}
        }
      }
    });

    return modal.result.then(
      function (result) {
        currentState.busy = true;
        var copyPromises = _.map(files, function (f) {
          var system = result.system || f.system;
          return f.copy({system: result.system, path: result.path, resource: result.resource}).then(function (result) {
            //notify(FileEvents.FILE_COPIED, FileEventsMsg.FILE_COPIED, f);
            return result;
          });
        });
        return $q.all(copyPromises).then(function (results) {
          currentState.busy = false;
          return results;
        });
      }
    );
  }


  // /**
  //  *
  //  */
  // function details () {
  //   throw new Error('not implemented')
  // }


  /**
   * Download files. Returns a promise that is resolved when all downloads have been
   * _started_. Resolved with the download URL for each file.
   *
   * @param {FileListing|FileListing[]} files
   * @return {Promise}
   */
  function download (files) {
    if (! Array.isArray(files)) {
      files = [files];
    }
    var download_promises = _.map(files, function(file) {
      return file.download().then(function (resp) {
        var link = document.createElement('a');
        link.style.display = 'none';
        link.setAttribute('href', resp.response.href);
        link.setAttribute('download', "null");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return resp;
      });
    });
    return $q.all(download_promises);
  }


  /**
   * TODO
   *
   * @returns {*}
   */
  function getFileManagers () {
    return $http.get('/api/files/file-managers/').then(function (resp) {
      return resp.data;
    });
  }


  /**
   *
   * @param {FileListing|FileListing[]} files
   */
  function containsFolder (files) {
    if (! Array.isArray(files)) {
      files = [files];
    }

    var folders = _.filter(files, {type:'dir'});
    return (folders.length > 0);
  }
  /**
   *
   * @param {string} permission
   * @param {FileListing|FileListing[]} files
   */
  function hasPermission (permission, files) {
    if (! Array.isArray(files)) {
      files = [files];
    }
    return _.reduce(files, function(memo, file) {
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
  function isProtected (file) {
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
  function mkdir () {
    var modal = $uibModal.open({
      templateUrl: '/static/portal/scripts/angular/data_depot/modals/data-browser-service-mkdir.html',
      controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
        $scope.form = {
          folderName: 'Untitled_folder'
        };

        $scope.doCreateFolder = function($event) {
          $event.preventDefault();
          $uibModalInstance.close($scope.form.folderName);
        };

        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel');
        };
      }]
    });

    return modal.result.then(function(folderName) {
      currentState.busy = true;
      currentState.listing.mkdir({
        name: folderName
      }).then(function(newDir) {
        currentState.busy = false;
        //notify(FileEvents.FILE_ADDED, FileEventsMsg.FILE_ADDED, newDir);
      }, function(err) {
        // TODO better error handling
        currentState.busy = false;
      });
    });
  }


  /**
   *
   * @param {FileListing|FileListing[]} files
   * @param {FileListing} initialDestination
   * @returns {Promise}
   */
  function move (files, initialDestination) {
    if (! Array.isArray(files)) {
      files = [files];
    }

    var modal = $uibModal.open({
      templateUrl: '/static/portal/scripts/angular/data_depot/modals/data-browser-service-move.html',
      controller: 'ModalMoveCopy',
      resolve: {
        data: {
          files: function () {
            console.log(files);
            return files;
          },
        // initialDestination: function () { return initialDestination; }
        }
      }
    });

    return modal.result.then(
      function (result) {
        currentState.busy = true;
        //if (result.system !== files[0].system){
        //  return $q.when(files);
        //}
        var movePromises = _.map(files, function (f) {
          return f.move({system: result.system, path: result.path}).then(function (result) {
            deselect([f]);
            //notify(FileEvents.FILE_MOVED, FileEventsMsg.FILE_MOVED, f);
            return result;
          });
        });
        return $q.all(movePromises).then(function (results) {
          currentState.busy = false;
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
  function preview (file, listing) {
    var modal = $uibModal.open({
      templateUrl: '/static/portal/scripts/angular/data_depot/modals/data-browser-service-preview.html',
      controller: 'ModalPreview',
      size: 'lg',
      resolve: {
        file: function() { return file; }
      }
    });


    return modal.result;
  }

  /**
   *
   * @param {FileListing} folder
   * @return {Promise}
   */
  function previewImages (folder) {
    var modal = $uibModal.open({
      windowClass: 'modal-full',
      templateUrl: '/static/portal/scripts/angular/data_depot/modals/data-browser-service-preview-images.html',
      controller: ['$scope', '$uibModalInstance', '$sce', 'folder',function ($scope, $uibModalInstance, $sce, folder) {
        $scope.folder = folder;
        var img_extensions = ['jpg', 'jpeg', 'png', 'tiff', 'gif'];
        $scope.busy = true;
        $scope.images = [];
        $scope.hrefs = [];
        $scope.carouselSettings = {
          dots: true,
          arrows: true,
          lazyLoad: true,
          event: {
            beforeChange: function (ev, slick, currentSlide, nextSlide) {
              $scope.images[nextSlide].href = $scope.hrefs[nextSlide].href;
            }
          }

        };
        $scope.folder.children.forEach(function (file) {
          var ext = file.path.split('.').pop().toLowerCase();
          if (img_extensions.indexOf(ext) !== -1) {
              $scope.hrefs.push({href: file.agaveUrl(), file:file});
              $scope.images.push({file:file});
          }
        });
        $scope.images[0] = $scope.hrefs[0];

        if ($scope.images.length > 10) {
          $scope.carouselSettings.dots = false;
        }

        $scope.close = function () {
          $uibModalInstance.dismiss();
        };

      }],
      size: 'lg',
      resolve: {
        folder: function() { return folder; }
      }
    });

    return modal.result;
  }

  /**
   *
   * @param {FileListing} file
   * @return {Promise}
   */
  function rename (file) {
    var modal = $uibModal.open({
      templateUrl: '/static/portal/scripts/angular/data_depot/modals/data-browser-service-rename.html',
      controller: ['$scope', '$uibModalInstance', 'file', function ($scope, $uibModalInstance, file) {
        $scope.form = {
          targetName: file.name
        };

        $scope.file = file;

        $scope.doRenameFile = function($event) {
          $event.preventDefault();
          $uibModalInstance.close({file: file, renameTo: $scope.form.targetName});
        };

        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel');
        };
      }],
      resolve: {
        file: file
      }
    });

    return modal.result.then(function (result) {
      currentState.busy = true;
      return result.file.rename({name: result.renameTo})
        .then(
          function (result) {
            currentState.busy = false;
            $rootScope.$broadcast('DataBrowserService::Refresh', {
              type: 'rename',
              context: result,
              msg: result
            });
          },
          function (err) {
            currentState.busy = false;
          });
    });
  }


  /**
   *
   * @param {FileListing|FileListing[]} files
   * @return {Promise}
   */
  function rm (files) {
    if (! Array.isArray(files)) {
      files = [files];
    }

    var modal = $uibModal.open({
      templateUrl: '/static/portal/apps/data_depot/modals/data-browser-service-rm.html',
      controller: ['$scope', '$uibModalInstance', 'files', function ($scope, $uibModalInstance, files) {
        $scope.files = files;

        $scope.confirm = function() {
          $uibModalInstance.close(files);
        };

        $scope.cancel = function() {
          $uibModalInstance.dismiss();
        };
      }],
      resolve: {
        files: function() { return files; }
      }
    });

    return modal.result.then(
      function (files) {
        currentState.busy = true;
        var deletePromises = _.map(files, function (file) {
          return file.rm().then(function (result) {
            deselect([file]);
            //notify(FileEvents.FILE_REMOVED, FileEventsMsg.FILE_REMOVED, file);
            return result;
          });
        });
        return $q.all(deletePromises).then(
          function (result) {
            currentState.busy = false;
            return result;
          },
          function (err) {
            currentState.busy = false;
          }
        );
      }
    );
  }


  /**
   * TODO
   *
   * @param options
   */
  function search (options) {
    currentState.busy = true;
    currentState.busyListing = true;
    currentState.error = null;
    return FileListing.search(options, apiParams).then(function (listing) {
      select([], true);
      currentState.busy = false;
      currentState.busyListing = false;
      currentState.listing = listing;
      return listing;
    }, function (err) {
      currentState.busy = false;
      currentState.busyListing = false;
      currentState.listing = null;
      currentState.error = err.data;
    });
  }


  /**
   * Update sharing permissions on a file.
   *
   * @param {FileListing} file
   * @return {*}
   */
  function share (file) {
    var modal = $uibModal.open({
      templateUrl: '/static/portal/apps/data_depot/modals/data-browser-service-share.html',
      controller: ['$scope', '$uibModalInstance', 'Django', 'file', function ($scope, $uibModalInstance, Django, file) {
        $scope.data = {
          busy: true,
          file: file,
          currentUser: Django.user,
          permissionOptions: [
            {permission: 'READ', label: 'Read Only'},
            {permission: 'READ_WRITE', label: 'Read/Write'},
            {permission: 'ALL', label: 'All'},
            {permission: 'NONE', label: 'None (Revoke Permission)'}
          ]
        };

        $scope.form = {
          currentPermissions: [],
          addPermissions: [{
            username: null,
            permission: $scope.data.permissionOptions[0]
          }]
        };

        file.listPermissions().then(
          function (result) {
            $scope.form.currentPermissions = _.chain(result)
              .reject(function (pem) { return pem.username === 'ds_admin' || pem.username === Django.user; })
              .map(
                function (pem) {
                  if (pem.permission.read) {
                    if (pem.permission.write) {
                      if (pem.permission.execute) {
                        pem.permission = $scope.data.permissionOptions[2];
                      } else {
                        pem.permission = $scope.data.permissionOptions[1];
                      }
                    } else {
                      pem.permission = $scope.data.permissionOptions[0];
                    }
                  } else {
                    pem.permission = $scope.data.permissionOptions[3];
                  }
                  return pem;
                }
              ).value();
            $scope.form.initialPermissions = angular.copy($scope.form.currentPermissions);
            $scope.data.busy = false;
          },
          function (errResp) {
            $scope.data.busy = false;
            $scope.data.errorMessage = errResp.data;
          }
        );

        $scope.formatSelection = function() {
          if (this.pem.username) {
            return this.pem.username.first_name +
              ' ' + this.pem.username.last_name +
              ' (' + this.pem.username.username + ')';
          }
        };

        $scope.addNewPermission = function() {
          $scope.form.addPermissions.push({username: null, permission: $scope.data.permissionOptions[0]});
        };

        $scope.doShareFiles = function($event) {
          $event.preventDefault();

          var pemsToSave = [];

          // Only save existing permissions if the permission changed
          _.each($scope.form.currentPermissions, function (pem) {
            var prev = _.findWhere($scope.form.initialPermissions, {username: pem.username});
            if (prev.permission.permission !== pem.permission.permission) {
              pemsToSave.push({username: pem.username, permission: pem.permission.permission});
            }
          });

          // Format new permissions
          var addPems = _.filter($scope.form.addPermissions, function (pem) {
            return pem.username;
          });
          Array.prototype.push.apply(pemsToSave, _.map(addPems, function (pem) {
            return {
              username: pem.username.username,
              permission: pem.permission.permission
            };
          }));

          // Resolve modal with pems that need to be saved
          $uibModalInstance.close(pemsToSave);
        };

        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel');
        };

      }],
      size: 'lg',
      resolve: {
        file: function () { return file; }
      }
    });

    return modal.result.then(function (pemsToSave) {
      currentState.busy = true;
      var sharePromises = _.map(pemsToSave, function (pem) {
        return file.share(pem);
      });
      return $q.all(sharePromises).then(function (results) {
        currentState.busy = false;
        return results;
      });
    });
  }


  /**
   *
   * @param {FileListing|FileListing[]} files The files to move to Trash
   * @return {Promise} A promise that is resolved with the trashed files when _all_ files have been
   * successfully Trashed.
   */
  function trash (files) {
    if (! Array.isArray(files)) {
      files = [files];
    }

    currentState.busy = true;
    var trashPromises = _.map(files, function(file) {
      return file.trash().then(function(trashed) {
        //notify(FileEvents.FILE_MOVED, FileEventsMsg.FILE_MOVED, trashed);
        return trashed;
      });
    });
    return $q.all(trashPromises).then(function(val) {
      currentState.busy = false;
      browse(currentState.listing, apiParams);
      return val;
    }, function(err) {
      currentState.busy = false;
    });
  }


  function _trashPath() {
    if (currentState.listing && currentState.listing.system) {
      switch (currentState.listing.system) {
        case 'designsafe.storage.default':
          return ['', Django.user, '.Trash'].join('/');
        case 'designsafe.storage.projects':
          var projectDir = currentState.listing.path.split('/')[1];
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
  function upload(directoryUpload, files) {
    var modal = $uibModal.open({
      templateUrl: '/static/portal/apps/data_depot/modals/data-browser-service-upload.html',
      controller: 'ModalUpload',
      size: 'lg',
      resolve: {
        directoryUpload: function() { return directoryUpload; },
        destination: function() { return currentState.listing; },
        files: function() { return files; },
        currentState: function() { return currentState; },
      }
    });
  }

  /**
   * Open Preview Tree
   */
  function openPreviewTree(entityUuid){
    var template = '/static/portal/apps/data_depot/modals/data-browser-preview-tree.html';
    var modal = $uibModal.open({
      templateUrl: template,
      controller:['$uibModalInstance', '$scope',
                  function($uibModalInstance, $scope){
        $scope.data = {};
        $scope.data.entityUuid = entityUuid;
        $scope.data.project = currentState.project;

        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel');
        };
                  }
      ]
    });
  }

  /**
   * TODO
   *
   * @param {FileListing} file The file to view metadata for
   * @return {HttpPromise}
   */
  function viewCategories (files, listing) {
    var template = '/static/portal/apps/data_depot/modals/data-browser-service-categories.html';
    var file = null;
    if (typeof files !== 'undefined'){
      file = files[0];
    }
    var modal = $uibModal.open({
      templateUrl: template,
      controller: 'ModalViewCategories',
      size: 'lg',
      resolve: {
        'file': function() { return file; },
        'form': function() { return {metadataTags: ''}; },
      }
    });

    return modal.result.then(function(data){
      var file = data.file;
      var form = data.form;
      var metaObj = {
        keywords: file.keywords || []
      };
      if (form.metadataTags) {
        metaObj.keywords = metaObj.keywords.concat(form.metadataTags.split(','));
      }
      if (form.tagsToDelete.length){
        metaObj.keywords = metaObj.keywords.filter(function(value){
          return form.tagsToDelete.indexOf(value) < 0;
        });
      }
      currentState.busy = true;
      file.updateMeta({'metadata': metaObj}).then(function(file_resp){
        //notify(FileEvents.FILE_META_UPDATED, FileEventsMsg.FILE_META_UPDATED, file_resp);
        currentState.busy = false;
      });
    });
  }

  /**
   * TODO
   *
   * @param {FileListing} file The file to view metadata for
   * @return {HttpPromise}
   */
  function viewMetadata (files, listing) {
    var template = '/static/portal/apps/data_depot/modals/data-browser-service-custom-tags.html';
    var file = null;
    if (typeof files !== 'undefined'){
      file = files[0];
    }
    if (typeof file !== 'undefined' &&
       typeof file.metadata !== 'undefined' &&
       file.metadata.project !== 'undefined'){
      template ='/static/portal/apps/data_depot/modals/data-browser-service-published-metadata.html';
    }
    var modal = $uibModal.open({
      templateUrl: template,
      controller: 'ModalViewMetadata',
      size: 'lg',
      resolve: {
        'file': function() { return file; },
        'form': function() { return {metadataTags: ''}; },
      }
    });

    return modal.result.then(function(data){
      var file = data.file;
      var form = data.form;
      var metaObj = {
        keywords: file.keywords || []
      };
      if (form.metadataTags) {
        metaObj.keywords = metaObj.keywords.concat(form.metadataTags.split(','));
      }
      if (form.tagsToDelete.length){
        metaObj.keywords = metaObj.keywords.filter(function(value){
          return form.tagsToDelete.indexOf(value) < 0;
        });
      }
      currentState.busy = true;
      file.updateMeta({'metadata': metaObj}).then(function(file_resp){
        //notify(FileEvents.FILE_META_UPDATED, FileEventsMsg.FILE_META_UPDATED, file_resp);
        currentState.busy = false;
      });
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
  function subscribe(scope, callback) {
    var handler = $rootScope.$on('DataBrowserService::Event', callback);
    scope.$on('$destroy', handler);
  }

  /**
   *
   * @param {FileEvents} eventType The event
   * @param {object} eventContext The object/context of the event. The value of this parameter depends on the `eventType`
   */
  function notify(eventType, eventMsg, eventContext) {
    $rootScope.$emit('DataBrowserService::Event', {
      type: eventType,
      context: eventContext,
      msg: eventMsg
    });
  }

  function scrollToTop(){
    return;
  }

  function scrollToBottom(){
    if (currentState.loadingMore || currentState.reachedEnd){
      return;
    }
    currentState.loadingMore = true;
    if (currentState.listing && currentState.listing.children &&
        currentState.listing.children.length < 95){
      currentState.reachedEnd = true;
      return;
    }
    currentState.page += 1;
    currentState.loadingMore = true;
    browsePage({system: currentState.listing.system,
                path: currentState.listing.path,
                page: currentState.page})
    .then(function(listing){
        currentState.loadingMore = false;
        if (listing.children.length < 95) {
          currentState.reachedEnd = true;
        }
      }, function (err){
           currentState.loadingMore = false;
           currentState.reachedEnd = true;
      });
  }

  return {
    /* properties */
    FileEvents: FileEvents,
    state: state,
    apiParameters: apiParameters,
    toolbarOptions: toolbarOptions,

    /* data/files functions */
    allowedActions: allowedActions,
    browse: browse,
    browsePage: browsePage,
    scrollToTop: scrollToTop,
    scrollToBottom: scrollToBottom,
    copy: copy,
    deselect: deselect,
    // details: details,
    download: download,
    getFileManagers: getFileManagers,
    hasPermission: hasPermission,
    isProtected: isProtected,
    mkdir: mkdir,
    move: move,
    preview: preview,
    previewImages: previewImages,
    rename: rename,
    rm: rm,
    search: search,
    select: select,
    share: share,
    trash: trash,
    upload: upload,
    viewMetadata: viewMetadata,
    viewCategories: viewCategories,

    /* events */
    subscribe: subscribe,
    notify: notify,
    apiParams: apiParams,
    toolbarOpts: toolbarOpts,
    showListing: showListing,
    showPreview: showPreview,
    openPreviewTree: openPreviewTree
  };

};

export default DataBrowserService;
