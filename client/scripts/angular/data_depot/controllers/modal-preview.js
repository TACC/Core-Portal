export default function ModalPreview($scope, $uibModalInstance, $sce, file) {
  'ngInject';
  $scope.file = file;
  if (typeof listing !== 'undefined' &&
      typeof listing.metadata !== 'undefined' &&
      !_.isEmpty(listing.metadata.project)){
    var _listing = angular.copy(listing);
    $scope.file.metadata = _listing.metadata;
  }
  $scope.busy = true;

  $scope.iframeLoadedCallback  = function () {
    $scope.busy = false;
    $scope.$apply();
  };

  file.preview().then(
    function (data) {
      $scope.previewHref = $sce.trustAs('resourceUrl', data.href);
    },
    function (err) {
      $scope.previewError = "Could not preview this item!";
      $scope.busy = false;
    });


  // $scope.tests = allowedActions([file]);
  //
  // $scope.download = function() {
  //   download(file);
  // };
  // $scope.share = function() {
  //   share(file);
  // };
  // $scope.copy = function() {
  //   copy(file);
  // };
  // $scope.move = function() {
  //   move(file, currentState.listing);
  // };
  // $scope.rename = function() {
  //   rename(file);
  // };
  // $scope.viewMetadata = function() {
  //   $scope.close();
  //   viewMetadata(file);
  // };
  // $scope.trash = function() {
  //   trash(file);
  // };
  // $scope.rm = function() {
  //   rm(file);
  // };

  $scope.close = function () {
    $uibModalInstance.dismiss();
  };

}
