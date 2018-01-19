export default function ModalUpload($scope, $q, $uibModalInstance, Modernizr, directoryUpload, destination, files, currentState) {
  'ngInject';
  $scope.data = {
    destination: destination,
    selectedFiles: files || [],
    uploads: []
  };

  $scope.state = {
    uploading: false,
    retry: false,
    directoryUpload: directoryUpload,
    directoryUploadSupported: Modernizr.fileinputdirectory,
    ui: {tagFiles: false}
  };

  $scope.$watch('data.selectedFiles', function(newValue) {
    _.each(newValue, function(val) {
      $scope.data.uploads.push({
        file: val,
        state: 'pending',
        promise: null
      });
    });

    // reset file control since we want to allow multiple selection events
    $('#id-choose-files').val(null);
  });

  $scope.tagFiles = function(){
    $uibModalInstance.close();
    var files = _.filter(currentState.listing.children, function(child){
      if(_.find($scope.data.uploads, function(upload){
        return upload.file.name === child.name;
      })){
          return true;
      }else{
          return false;
      }
    });
    if (files.length){
      viewCategories(files);
    } else {
      viewCategories();
    }
  };

  $scope.upload = function() {
    $scope.state.uploading = true;
    var tasks = _.map($scope.data.uploads, function(upload) {
      upload.state = 'uploading';

      var formData = new window.FormData();
      formData.append('file', upload.file);
      if (upload.file.webkitRelativePath) {
        formData.append('relative_path', upload.file.webkitRelativePath);
      }
      return currentState.listing.upload(formData).then(
        function (resp) {
          upload.state = 'success';
          return {status: 'success', response: resp};
        },
        function (err) {
          upload.state = 'error';
          upload.error = err.data;
          return {status: 'error', response: err.data};
        }
      );
    });

    $q.all(tasks).then(function (results) {
      $scope.state.uploading = false;

      currentState.busy = true;
      currentState.listing.fetch().then(function () {
        currentState.busy = false;
        if(currentState.project){
          currentState.ui.tagFiles = true;
          $scope.state.ui.tagFiles = true;
        }
      });

      var errors = _.filter(results, function (result) {
        return result.status === 'error';
      });

      if (errors.length > 0) {
        // oh noes...give the user another chance with any errors
        $scope.state.retry = true;
      } else {
        // it's all good; close the modal
        if (!currentState.project){
          $uibModalInstance.close();
        }
      }
    });
  };

  $scope.retry = function() {
    $scope.data.uploads = _.where($scope.data.uploads, {state: 'error'});
    $scope.upload();
    $scope.state.retry = false;
  };

  /**
   * Remove an upload from the list of staged uploads.
   *
   * @param index
   */
  $scope.removeUpload = function (index) {
    $scope.data.uploads.splice(index, 1);
  };

  /**
   * Clear all staged uploads.
   */
  $scope.reset = function () {
    // reset models
    $scope.data.selectedFiles = [];
    $scope.data.uploads = [];
  };

  /**
   * Cancel and close upload dialog.
   */
  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
}
