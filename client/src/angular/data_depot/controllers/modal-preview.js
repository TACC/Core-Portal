import _ from 'underscore';
import angular from 'angular';

export default function ModalPreview($scope, $uibModalInstance, $sce, file, listing) {
  'ngInject';
  $scope.file = file;
  $scope.busy = true;

  if (typeof listing !== 'undefined' &&
      typeof listing.metadata !== 'undefined' &&
      !_.isEmpty(listing.metadata.project)) {
    var _listing = angular.copy(listing);
    $scope.file.metadata = _listing.metadata;
  }

  $scope.iframeLoadedCallback  = function () {
    $scope.busy = false;
    $scope.$apply();
  };

  file.preview().then(
    function (data) {
      $scope.previewHref = $sce.trustAs('resourceUrl', data.href);
      // $scope.busy = false;
    },
    function (err) {
      var fileExt = file.name.split('.').pop();
      var videoExt = ['webm', 'ogg', 'mp4'];

      //check if preview is video
      if (videoExt.includes(fileExt)) {
        $scope.prevVideo = true;
        file.download().then(
          function (data) {
            var postit = data.href;
            var oReq = new XMLHttpRequest();
            oReq.open("GET", postit, true);
            oReq.responseType = 'blob';

            oReq.onload = function () {
              if (this.status === 200) {
                var videoBlob = this.response;
                var vid = URL.createObjectURL(videoBlob);

                // set video source and mimetype
                document.getElementById("videoPlayer").src = vid;
                document.getElementById("videoPlayer").setAttribute('type', `video/${fileExt}`);
              };
            };
            oReq.onerror = function () {
              $scope.previewError = err.data;
              $scope.busy = false;
            };
            oReq.send();
            $scope.busy = false;
          },
          function (err) {
            $scope.previewError = err.data;
            $scope.busy = false;
          });
        // if filetype is not video or ipynb
      } else if (fileExt != 'ipynb') {
        $scope.previewError = err.data;
        $scope.busy = false;
        // if filetype is ipynb
      } else {
        file.download().then(
          function (data) {
            var postit = data.href;
            var oReq = new XMLHttpRequest();

            oReq.open("GET", postit, true);

            oReq.onload = function (oEvent) {
              var blob = new Blob([oReq.response], { type: "application/json" });
              var reader = new FileReader();

              // reader.onload = function (e) {
              //   var content = JSON.parse(e.target.result);
              //   var target = $('.nbv-preview')[0];
              //   // nbv.render(content, target);
              // };

              reader.readAsText(blob);
            };

            oReq.send();
          },
          function (err) {
            $scope.previewError = err.data;
            $scope.busy = false;
          });
      }
    }
  );

  $scope.close = function () {
    $uibModalInstance.dismiss();
  };

}
