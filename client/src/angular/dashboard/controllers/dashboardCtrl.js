import DS_TSBarChart from '../charts/DS_TSBarChart';
import moment from 'moment';
import * as _ from 'underscore';

export default function DashboardCtrl (
  $uibModal,
  $scope,
  $q,
  $translate,
  Jobs,
  Apps,
  SystemsService,
  UserService
) {
  'ngInject';
  $scope.data = {};
  $scope.ui = {};
  $scope.display_job_details = false;
  $scope.loading_tickets = false;
  $scope.loading_jobs = true;
  $scope.today = new Date();
  $scope.usage = {total_storage_bytes: 0};
  UserService.usage().then(function (resp) {
    $scope.usage = resp;
  });

  $scope.first_jobs_date = new Date(
    $scope.today.getTime() - (14 * 24 * 60 * 60 * 1000 )
  );
  $scope.first_jobs_date = new Date(
    $scope.first_jobs_date.setHours(0,0,0,0)
  );
  $scope.chart = new DS_TSBarChart('#ds_jobs_chart')
    .height(250)
    .xSelector(function (d) { return d.key;})
    .ySelector(function (d) { return d.values.length;})
    .start_date($scope.first_jobs_date);

  //Systems stuff
  $scope.data.execSystems = [];
  $scope.data.strgSystems = [];
  $scope.ui.loadingSystems = true;
  $scope.ui.testSystems = {};
  $scope.ui.pushSystems = {};
  $scope.ui.resetSystems = {};

  $scope.chart.on('bar_click', function (ev, toggled) {
    if (toggled){
      $scope.display_job_details = true;
    } else {
      $scope.display_job_details = false;
    }
    $scope.jobs_details = ev.values;
    $scope.$apply();
  });

  Jobs.list(
    {
      'created.gt':moment($scope.first_jobs_date).format('Y-M-D')
    }
  ).then(function (resp) {
    $scope.jobs = resp;
    $scope.chart_data = Jobs.jobsByDate(resp);
    $scope.chart.data($scope.chart_data);
    var tmp = _.groupBy($scope.jobs, function (d) {return d.appId;});
    $scope.recent_apps = Object.keys(tmp);
    $scope.loading_jobs = false;
  });

  Apps.list({"$and": [{"name": `${$translate.instant('apps_metadata_name')}`}, {"value.definition.available": true}]}).then(function(resp) {
    var tmp = _.groupBy(resp, function (d) {return d.label;});
    $scope.apps = Object.keys(tmp);
  });

  SystemsService.list().then(function(resp){
    _.each(resp.execution, function(exec){
      let pubKey = resp.publicKeys[exec.id];
      exec.keysTracked = false;
      if (pubKey.public_key !== null &&
          typeof pubKey.public_key !== 'undefined'){
        exec.publicKey = pubKey;
        exec.keysTracked = true;
      }
      $scope.data.execSystems.push(exec);
    });
    _.each(resp.storage, function(strg){
      let pubKey = resp.publicKeys[strg.id];
      strg.keysTracked = false;
      if (pubKey.public_key !== null &&
          typeof pubKey.public_key !== 'undefined'){
        strg.publicKey = pubKey;
        strg.keysTracked = true;
      }
      $scope.data.strgSystems.push(strg);
    });
  }, function(err){
    $scope.ui.systemsErrors = err;
  }).finally(function(){
    $scope.ui.loadingSystems = false;
  });

  // TicketsService.get().then(function (resp) {
  //   $scope.my_tickets = resp;
  //   $scope.loading_tickets = false;
  // }, function (err) {
  //   $scope.loading_tickets = false;
  // });

  /**
  * Test a system
  * @function
  * @param {Object} sys - System object
  */
  $scope.testSystem = function _testSystems(sys){
    $scope.ui.testSystems[sys.id] = {
      'testing': true,
      'error': false,
      'response': null
    };
    SystemsService.test(sys).then(function(resp){
      $scope.ui.testSystems[resp.response.systemId] = {
        'testing': false,
        'error': false,
        'response': resp.response.message
      };
    }, function(err){
      $scope.ui.testSystems[err.data.response.systemId] = {
        'testing': false,
        'error': true,
        'response': err.data.response.message
      };
    });
  };

  /**
  * Shows a system's public key
  * @function
  * @param {Object} sys - System Object
  */
  $scope.publicKey = function _publicKey(sys){
    alert(sys.publicKey.public_key);
  };

  /**
  * Resets a system's keys
  * @function
  * @param {Object} sys - System object
  */
  $scope.resetKeys = function _resetKeys(sys){
    $scope.ui.resetSystems[sys.id] = {
      'resetting': true,
      'error': false,
      'response': null
    };
    SystemsService.resetKeys(sys).
      then(function(resp){
        let _sys = _.findWhere(
          $scope.data.strgSystems,
          {id: resp.systemId}
        );
        if (!_sys){
          _sys = _.findWhere(
            $scope.data.execSystems,
            {id: resp.systemId }
          );
        }
        _sys.keysTracked = true;
        _sys.publicKey.public_key = resp.publicKey;
        $scope.ui.resetSystems[resp.systemId] = {
          'resetting': false,
          'error': false,
          'response': resp.message
        };
      }, function(resp){
        $scope.ui.resetSystems[resp.systemId] = {
          'resetting': false,
          'error': true,
          'response': resp.message
        };
      });
  };

  /**
  * Pushes a private key to the specified host
  * @function
  * @param {Object} sys - System object
  */
  $scope.pushKey = function _pushKeys(sys){
    $scope.ui.pushSystems[sys.id] = {
      'pushing': true,
      'error': false,
      'response': null
    };
    let modal = $uibModal.open({
      component: 'systemPushKeysModal',
      resolve: {
        sys: function(){
          return sys;
        }
      }
    });
    modal.result.finally(
      function(){
        $scope.ui.pushSystems[sys.id] = {
          'resetting': false,
          'error': false,
          'response': ''
        };
      });
  };
}
