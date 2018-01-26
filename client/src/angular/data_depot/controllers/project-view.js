export default function ProjectViewCtrl($scope, $state, Django, ProjectService, ProjectEntitiesService, DataBrowserService, projectId, FileListing, $uibModal, $q, $http) {
  'ngInject';
  $scope.data = {};
  $scope.state = DataBrowserService.state();
  $scope.ui = {};

  function setEntitiesRel(resp){
    $scope.data.project.setEntitiesRel(resp);
    return resp;
  }

  ProjectService.get({uuid: projectId}).then(function (project) {
    $scope.data.project = project;
    DataBrowserService.state().project = project;
    DataBrowserService.state().loadingEntities = true;
    $scope.data.loadingEntities = true;
    var _related = project._related;
    var tasks = [];
    for (var attrname in _related){
      var name = _related[attrname];
      if (name != 'designsafe.file'){
        tasks.push(ProjectEntitiesService.listEntities(
          {uuid: projectId, name: name})
          .then(setEntitiesRel)
          );
      }
    }
    $q.all(tasks).then(
      function(resp){
        //$scope.data.project.setupAllRels();
        return resp;
      }).then(
      function(resp){
          DataBrowserService.state().loadingEntities = false;
          $scope.data.loadingEntities = false;
      }, function(err){
          DataBrowserService.state().loadingEntities = false;
          $scope.data.loadingEntities = false;
      }).then(function(){
          ProjectService.getCollaborators({uuid:DataBrowserService.state().project.uuid}).then(function(resp){
              DataBrowserService.state().project.value.teamMembers = _.without(resp.data.teamMembers, 'ds_admin');
          });
      }
      );
  });

  $scope.showText = function(text){
      $uibModal.open({
          template: '<div class="modal-header">' +
                      '<h3>Description</h3>' +
                    '</div>' +
                    '<div class="modal-body">' +
                      '<div style="border: 1px solid black;"' +
                                 '"padding:5px;">' +
                        '{{text}}' +
                      '</div>' +
                    '</div>' +
                    '<div class="modal-footer">' +
                      '<button class="btn btn-default" ng-click="close()">' +
                        'Close' +
                      '</button>' +
                    '</div>',
          controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance){
              $scope.text = text;
              $scope.close = function(){
                  $uibModalInstance.dismiss('Close');
              };
          }]
      });
  };

  $scope.editProject = function($event) {
    if ($event){
      $event.preventDefault();
    }
    ProjectService.editProject($scope.data.project)
      .then(function (project) {
        $scope.data.project = project;
      });
  };

  $scope.manageCollabs = function($event) {
    if ($event){
      $event.preventDefault();
    }
    ProjectService.manageCollaborators($scope.data.project).then(function (res) {

      // $scope.data.project.pi = res.data.pi;
      // $scope.data.project.coPis = res.data.coPis;
      // $scope.data.project.teamMembers = res.data.teamMembers;
    });
  };

  $scope.manageExperiments = function($event) {
    if ($event){
      $event.preventDefault();
    }
    var experimentsAttr = $scope.data.project.getRelatedAttrName('designsafe.project.experiment');
    var experiments = $scope.data.project[experimentsAttr];
    if (typeof experiments === 'undefined'){
      $scope.data.project[experimentsAttr] = [];
      experiments = $scope.data.project[experimentsAttr];
    }
    ProjectService.manageExperiments({'experiments': experiments,
                                      'project': $scope.data.project}).then(function (experiments) {
      $scope.data.experiments = experiments;
    });
  };

  $scope.dateString = function(s){
    var d = Date(s);
    return d;
  };

  $scope.showListing = function(){
    //DataBrowserService.state().showMainListing = true;
    //DataBrowserService.state().showPreviewListing = false;
    DataBrowserService.showListing();
  };

  $scope.showPreview = function(){
    //DataBrowserService.state().showMainListing = false;
    //DataBrowserService.state().showPreviewListing = true;
    $scope.previewHref = undefined;
    DataBrowserService.showPreview();
    FileListing.get({'system': $scope.browser.listing.system,
                     'name': 'projectimage.jpg',
                     'path': '/projectimage.jpg'}).then(function(list){
                      list.preview().then(function(data){
                          $scope.previewHref = data.postit;
                      });
                    });
  };

  $scope.publishPipeline_start = function(){
    $scope.state.publishPipeline = 'select';
  };

  $scope.publishPipeline_review = function(){
    $scope.state.publishPipeline = 'review';
  };

  $scope.publishPipeline_meta = function(){
    $scope.state.publishPipeline = 'meta';
  };

  $scope.publishPipeline_exit = function(){
    $scope.state.publishPipeline = undefined;
    $scope.ui.publicationMessages = [];
  };

  $scope.publishPipeline_prev = function(st){
    if (st == 'agreement'){
      $scope.state.publishPipeline = 'meta';
    } else if (st == 'meta'){
      $scope.state.publishPipeline = 'review';
    }
    else if (st == 'review'){
      $scope.state.publishPipeline = 'select';
    }
    else {
      $scope.state.publishPipeline = 'select';
    }
  };

  $scope.publishPipeline_next = function(st){
    if (st == 'select'){
      $scope.state.publishPipeline = 'review';
    }
    else if (st == 'review'){
      var institutions = [];
      _.each($scope.state.publication.experimentsList, function(exp){
          var o = {
              label: exp.getEF($scope.state.project.value.projectType,
              exp.value.experimentalFacility).institution,
              name: exp.value.experimentalFacility
              };
          institutions.push(o);
      });
      _.each($scope.state.publication.users, function(user){
          institutions.push({ label: user.profile.institution,
                              name: user.username});
      });
      $scope.state.publication.institutions = _.uniq(institutions, function(inst){ return inst.label;});
      $scope.state.publishPipeline = 'meta';
    }
    else if (st == 'meta'){
      $scope.state.publishPipeline = 'agreement';
    }else {
      $scope.state.publishPipeline = 'agreement';
    }
  };

  $scope.publishPipeline_publish = function(){
    var publication = angular.copy($scope.state.publication);
    var experimentsList = [];
    var eventsList = [];
    var analysisList = [];
    var reportsList = [];
    var modelConfigs = [];
    var sensorLists = [];
    var publicationMessages = [];
    if (publication.experimentsList){
      experimentsList = _.map(publication.experimentsList, function(exp){
        exp.value.equipmentType = exp.getET(exp.value.experimentalFacility,
                                            exp.value.equipmentType).label;
        exp.value.experimentalFacility = exp.getEF($scope.state.project
              .value.projectType,
              exp.value.experimentalFacility).label;
        exp.events = $scope.state.publication;
        delete exp._ui;
        delete exp.events;
        if (!exp.value.authors.length){
          publicationMessages.push({title: 'Experiment ' + exp.value.title,
                                    message: 'Missing authors'});
        }
        return exp;
      });
      delete publication.experimentsList;

    }
    if (publication.eventsList){
      var _eventsList = angular.copy(publication.eventsList);
      delete publication.eventsList;
      var expsUuids = _.map(experimentsList, function(exp){
                            return exp.uuid; });
      eventsList = _.filter(_eventsList,
                 function(evt){
                   return _.intersection(evt.associationIds, expsUuids);
                 });
      var mcfsUuids = [];
      var slsUuids = [];
      _.each(eventsList, function(evt){
          mcfsUuids = mcfsUuids.concat(evt.value.modelConfigs);
          slsUuids = slsUuids.concat(evt.value.sensorLists);
          delete evt.tagsAsOptions;
          evt.fileObjs = _.map($scope.state.listings[evt.uuid], function(f){
                return {
                    'path': f.path,
                    'type': f.type,
                    'length': f.length,
                    'name': f.name
                };
          });
          if (!evt.fileObjs.length){
              publicationMessages.push({title: 'Event ' + evt.value.title,
                                        message: 'Missing files'});
          }
      });
      _.each(mcfsUuids, function(mcf){
        var _mcf = angular.copy($scope.state.project.getRelatedByUuid(mcf));
        delete _mcf.tagsAsOptions;
        _mcf.fileObjs = _.map($scope.state.listings[_mcf.uuid], function(f){
            return {
                'path': f.path,
                'type': f.type,
                'length': f.length,
                'name': f.name
            };
        });
        if (!_mcf.fileObjs.length){
            publicationMessages.push({title: 'Model Config '+ _mcf.value.title,
                                      message: 'Missing files.'});
        }
        modelConfigs.push(_mcf);
      });
      _.each(slsUuids, function(slt){
        var _slt = angular.copy($scope.state.project.getRelatedByUuid(slt));
        delete _slt.tagsAsOptions;
        _slt.fileObjs = _.map($scope.state.listings[_slt.uuid], function(f){
          return {
              'path': f.path,
              'type': f.type,
              'length': f.length,
              'name': f.name
          };
        });
        if (!_slt.fileObjs.length){
            publicationMessages.push({title: 'Sensor Info ' + _slt.value.title,
                                      message: 'Missing files.'});
        }
        sensorLists.push(_slt);
      });
    }
    if (publication.analysisList){
      analysisList = _.map(publication.analysisList, function(ana){
        delete ana.tagsAsOptions;
        ana.fileObjs = _.map($scope.state.listings[ana.uuid], function(f){
            return {
                'path': f.path,
                'type': f.type,
                'length': f.length,
                'name': f.name
            };
        });
        if (!ana.fileObjs.length){
            publicationMessages.push({title: 'Analysis ' + ana.value.title,
                                      message: 'Missing Files'});
        }
        return ana;
      });
      delete publication.analysisList;
    }
    if (publication.reportsList) {
      reportsList = _.map(publication.reportsList, function(rep){
          rep.fileObjs = _.map($scope.state.listings[rep.uuid], function(f){
              return {
                  'path': f.path,
                  'type': f.type,
                  'length': f.length,
                  'name': f.name
              };
          });
          return rep;
      });
      delete publication.reportsList;
    }
    var project = angular.copy($scope.state.project);
    delete project._allRelatedObjects;
    _.each(project._related, function(val, key){
      delete project[key];
    });
    delete publication.filesSelected;
    publication.project = project;
    publication.eventsList = eventsList;
    publication.modelConfigs = modelConfigs;
    publication.sensorLists = sensorLists;
    publication.analysisList = analysisList;
    publication.reportsList = reportsList;
    publication.experimentsList = experimentsList;
    if (publicationMessages.length){
        $scope.ui.publicationMessages = publicationMessages;
        return;
    }
    $http.post('/api/projects/publication/', {publication: publication})
      .then(function(resp){
        $scope.state.publicationMsg = resp.data.message;
        $scope.state.project.publicationStatus = 'publishing';
        DataBrowserService.state().publicationMsg = resp.data.message;
        DataBrowserService.state().project.publicationStatus = 'publishing';
      });
  };

}
