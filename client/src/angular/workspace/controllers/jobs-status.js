import jobDetailsModalTemplate from '../templates/job-details-modal.html';


function JobsStatusCtrl($scope, $controller, $rootScope, $uibModal, Jobs) {
    'ngInject';

    $controller('WorkspacePanelCtrl', { $scope: $scope });
    $scope.data = {
        hasMoreJobs: true,
        limit: 10,
    };

    $scope.jobDetails = function(job) {
        Jobs.get(job.id).then(function(resp) {
            $scope.data.interactive = false;
            if (resp.status === 'RUNNING' && resp._embedded.metadata) {
                for (let i = 0; i < resp._embedded.metadata.length; i++) {
                    if (resp._embedded.metadata[i].name === 'interactiveJobDetails') {
                        let meta = resp._embedded.metadata[i];
                        $scope.data.interactive = true;
                        $scope.data.connection_address = meta.value.action_link;
                        break;
                    }
                }
            }

            $uibModal.open({
                template: jobDetailsModalTemplate,
                controller: 'JobDetailsModalCtrl',
                scope: $scope,
                resolve: {
                    job: resp,
                },
            });
        });
    };

    $scope.jobFinished = function(job) {
        return job.status == 'FINISHED' || job.status == 'FAILED';
    };

    $scope.refresh = function() {
        $scope.data.loading = true;
        Jobs.list({ limit: $scope.data.limit }).then(
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
}

function JobDetailsModalCtrl($scope, $uibModalInstance, $http, Jobs, job) {
    'ngInject';
    $scope.job = job;

    $scope.dismiss = function() {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.deleteJob = function() {
        $http.delete('/api/workspace/jobs/', {
            params: { job_id: job.id },
        }).then(function(response) {
            $uibModalInstance.dismiss('cancel');
            $scope.$parent.$broadcast('jobs-refresh');
        }, function(error) {
        });
    };

    $scope.cancelJob = function() {
        $http.post('/api/workspace/jobs/', {
            job_id: job.id, params: { job_id: job.id, action: 'cancel', body: '{"action":"stop"}' },
        }).then(function(response) {
            $uibModalInstance.dismiss('cancel');
            $scope.$parent.$broadcast('jobs-refresh');
        }, function(error) {
        });
    };
}

export { JobsStatusCtrl, JobDetailsModalCtrl };
