import _ from 'underscore';
import angular from 'angular';

export default function ModalPreview($scope, $uibModalInstance, $sce, file) {
  'ngInject';
  $scope.file = file;
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


  $scope.close = function () {
    $uibModalInstance.dismiss();
  };

}
