
  function JobsStatusCtrl($scope, $controller, $rootScope, $uibModal, Jobs) {
    'ngInject';

    $controller('WorkspacePanelCtrl', {$scope: $scope});
    $scope.data = {
      hasMoreJobs: true,
      limit: 10
    };

    $scope.jobDetails = function(job) {
      Jobs.get(job.id).then(function(resp) {
        $scope.data.interactive = false;
        if(resp.status === 'RUNNING' && resp._embedded.metadata) {
          for(var i=0; i < resp._embedded.metadata.length; i++){
            if(resp._embedded.metadata[i].name === 'interactiveJobDetails') {
              var meta = resp._embedded.metadata[i];
              $scope.data.interactive = true;
              $scope.data.connection_address = meta.value.extra.target_uri;
              break;
            }
          }
        }

        $uibModal.open({
          templateUrl: '/static/src/angular/workspace/templates/job-details-modal.html',
          controller: 'JobDetailsModalCtrl',
          scope: $scope,
          resolve: {
            job: resp,
          }
        });
      });
    };

    $scope.refresh = function() {
      $scope.data.loading = true;
      Jobs.list({limit: $scope.data.limit}).then(
        function(resp) {
          $scope.data.loading = false;
          $scope.data.jobs = resp;
        });
    };
    $scope.refresh();

    $scope.loadMore = function() {
      $scope.data.limit += 10;
      $scope.refresh();
    };

    $scope.$on('job-submitted', function(e, data) {
      $scope.refresh();
    });

    $scope.$on('jobs-refresh', function(e, data) {
      $scope.refresh();
    });

    /*
     * Receives the webhook notification from the vnc-type job and opens the
     * modal dialog in the workspace letting the user know their job is ready
     * to connect to.
     */
    // $scope.$on('ds.wsBus:default', function update_job(e, msg){
    // $scope.$on('ds.wsBus:notify', function update_job(e, msg){
    //   if('event_type' in msg && msg.event_type === 'VNC') {
    //     $uibModal.open({
    //       templateUrl: 'local/vncjob-details-modal.html',
    //       controller: 'VNCJobDetailsModalCtrl',
    //       scope: $scope,
    //       resolve: {
    //         msg: msg
    //       }
    //     });
    //   }
    //   else {
    //     for (var i=0; i < $scope.data.jobs.length; i++){
    //         if ($scope.data.jobs[i]['id'] == msg.extra.id) {
    //           $scope.data.jobs[i]['status'] = msg.extra.status;
    //           $scope.$apply();
    //           break;
    //         }
    //     }
    //   }
    // });


  };

function JobDetailsModalCtrl($scope, $uibModalInstance, $http, Jobs, job) {
  'ngInject';
  $scope.job = job;

  $scope.dismiss = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.deleteJob = function() {
    $http.delete('/api/workspace/jobs/', {
      params: {'job_id': job.id}
    }).then(function(response){
      $uibModalInstance.dismiss('cancel');
      $scope.$parent.$broadcast('jobs-refresh');
    }, function(error) {
    });
  };

  $scope.cancelJob = function() {
    $http.post('/api/workspace/jobs/', {
      'job_id': job.id, params: {'job_id': job.id, 'action':'cancel', 'body':'{"action":"stop"}'},
    }).then(function(response){
      $uibModalInstance.dismiss('cancel');
      $scope.$parent.$broadcast('jobs-refresh');
    }, function(error) {
    });
  };

};

function VNCJobDetailsModalCtrl($scope, $uibModalInstance, msg) {
  'ngInject';
  $scope.msg = msg;
  $scope.dismiss = function() {
    $uibModalInstance.dismiss('cancel');
  };
}

export {JobsStatusCtrl, JobDetailsModalCtrl, VNCJobDetailsModalCtrl};
