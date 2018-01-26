(function(window, angular) {
  var app = angular.module('designsafe');

  app.controller('ModalViewMetadata', ['$uibModalInstance', '$scope', 'file',
               function ($uibModalInstance, $scope, file) {
    $scope.data = {file: file,
       form: {metadataTags: '',
                          tagsToDelete: []},
                   files: files,
                   error:'',
                   fileUuids: [],
                   project: currentState.project,
                   fileProjectTags: [],
                   newFileProjectTags: [],
                   projectTagsToUnrelate: [],
                   fileSubTags: {}};

    $scope.ui = {error: false};
    $scope.ui.analysisData = [
      {name: 'graph', label: 'Graph'},
      {name: 'visualization', label: 'Visualization'},
      {name: 'table', label: 'Table'},
      {name: 'other', label: 'Other'}
    ];
    $scope.ui.analysisApplication = [
      {name: 'matlab', label: 'Matlab'},
      {name: 'r', label: 'R'},
      {name: 'jupyter', label: 'Jupyter'},
      {name: 'other', label: 'Other'}
    ];
    $scope.ui.labels = {};
    $scope.ui.labels['designsafe.project.model_config'] = [
      {name: 'modelDrawing', label: 'Model Drawing'}
    ];
    $scope.ui.labels['designsafe.project.event'] = [
      {name: 'load', label: 'Load'}
    ];
    $scope.ui.labels['designsafe.project.sensor_list'] = [
      {name: 'sensorDrawing', label: 'Sensor Drawing'}
    ];
    $scope.ui.labels['designsafe.project.analysis'] = [
      {name: 'script', label: 'Script'}
    ];
    if (typeof listing !== 'undefined' &&
        typeof listing.metadata !== 'undefined' &&
        !_.isEmpty(listing.metadata.project)){
      var _listing = angular.copy(listing);
      $scope.data.file.metadata = _listing.metadata;
    }else if (files.length == 1){
      $scope.ui.busy = true;
      file.getMeta().then(function(file){
        $scope.ui.busy = false;
        $scope.data.fileUuids = [file.uuid()];
      }, function(err){
        $scope.ui.busy = false;
        $scope.ui.error = err;
      });
    } else if (files.length > 0){
      $scope.ui.busy = true;
      var tasks = _.map(files, function(f){
        if (f.uuid().length === 0){
          return f.getMeta();
        }
      });
      $q.all(tasks).then(
          function(resp){
            $scope.ui.busy = false;
            $scope.data.fileUuids = [];
            $scope.data.fileUuids = _.map(files, function(f){ return f.uuid(); });
          },
          function(err){
            $scope.error = err;
          });
    }
    var _setFileEntities = function(){
      var entities = currentState.project.getAllRelatedObjects();
      _.each($scope.data.files, function(child){
        child.setEntities(currentState.project.uuid, entities);
      });
    };
    var _setEntities = function(){
      _.each($scope.data.files, function(file){
        if ($scope.data.fileProjectTags.length === 0){
          $scope.data.fileProjectTags = file._entities;
        }
        var diff = _.difference($scope.data.fileProjectTags, file._entities);
        if (diff.length > 0){
          $scope.data.fileProjectTags = [];
        }
      });
    };
    _setEntities();

    $scope.isFileTagged = function(file, entity){
        var tags = entity.value.tags;
        var tag;
        var predicate = function(v){ return v === file.uuid();};
        for (var t in tags){
            for(var st in tags[t]){
                if (_.findIndex(tags[t][st].file, predicate) > -1){
                    tag = st;
                    break;
                }
            }
        }
        return tag;
    };

    $scope.getFileSubTag = function(file, entity){
      if (entity.name === 'designsafe.project.event'){
        return 'Load';
      }else if(entity.name === 'designsafe.project.model_config'){
        return 'Model Drawing';
      }else if(entity.anem === 'designsafe.project.sensor_list'){
        return 'Sensor Drawing';
      }else if(entity.name === 'designsafe.project.analysis'){
        return 'Script';
      }
      return '-';
    };

    $scope.saveFileTags = function(){
      var sttasks = [];
      for (var euuid in $scope.data.fileSubTags){
        var sts = $scope.data.fileSubTags[euuid] || [];
        var entity = currentState.project.getRelatedByUuid(euuid);
        for (var fuuid in sts){
          if (sts[fuuid] == 'none'){
            continue;
          }
          if (typeof entity[sts[fuuid]] === 'undefined' ||
              !_.isArray(entity[sts[fuuid]])){
            entity.value[sts[fuuid]] = [];
          }
          entity.value[sts[fuuid]].push(fuuid);
          sttasks.push(ProjectEntitiesService.update(
                  {data: {uuid: entity.uuid, entity:entity}}));
          }
        }
      $scope.ui.busy = true;
      $q.all(sttasks).then(function(resps){
        $scope.data.fileSubTags = [];
        _setFileEntities();
        _setEntities();
        $scope.ui.parentEntities = currentState.project.getParentEntity($scope.data.files);
        $scope.ui.busy = false;
      });
      };

    $scope.ui.parentEntities = currentState.project.getParentEntity($scope.data.files);

$scope.doSaveMetadata = function($event) {
$event.preventDefault();
$uibModalInstance.close($scope.data);
};

$scope.isMarkedDeleted = function(tag){
return $scope.data.form.tagsToDelete.indexOf(tag) > -1;
};

$scope.toggleTag = function(tag){
var id = $scope.data.form.tagsToDelete.indexOf(tag);
if (id > -1){
  $scope.data.form.tagsToDelete.splice(id, 1);
} else {
  $scope.data.form.tagsToDelete.push(tag);
}
};

    /**
     * Cancel and close upload dialog.
     */
    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

    $scope.ui.addingTag = false;
    $scope.ui.tagTypes = [
        {label: 'Model Config',
         name: 'designsafe.project.model_config'},
        {label: 'Sensor Info',
         name: 'designsafe.project.sensor_list'},
        {label: 'Event',
         name: 'designsafe.project.event'},
        {label: 'Analysis',
         name: 'designsafe.project.analysis'}
        ];
    $scope.data.form.projectTagToAdd = {optional:{}};

    $scope.isProjectTagSel = function(entity){
      if (_.findWhere($scope.data.newFileProjectTags, {uuid: entity.uuid})){
        return true;
      } else if (_.findWhere($scope.data.projectTagsToUnrelate, {uuid: entity.uuid})){
        return false;
      } else if ( _.findWhere($scope.data.fileProjectTags, {uuid: entity.uuid})){
        return true;
      }
      return false;
    };

    $scope.toggleProjectTag = function(entity){
      if (_.findWhere($scope.data.newFileProjectTags, {uuid: entity.uuid})){
        $scope.data.newFileProjectTags = _.reject($scope.data.newFileProjectTags,
                                                  function(e){
                                                    if (e.uuid === entity.uuid){
                                                      return true;
                                                    } else {
                                                      return false;
                                                    }
                                                  });
      } else if (_.findWhere($scope.data.fileProjectTags, {uuid: entity.uuid})){
          if(_.findWhere($scope.data.projectTagsToUnrelate, {uuid: entity.uuid})){
            $scope.data.projectTagsToUnrelate = _.reject(
                  $scope.data.projectTagsToUnrelate, function(e){
                    if(e.uuid === entity.uuid){ return true; }
                    else { return false; }
                  });
          } else {
            $scope.data.projectTagsToUnrelate.push(entity);
          }
      } else {
        $scope.data.newFileProjectTags = [entity];
      }
    };

    $scope.saveRelations = function(){
      var tasks = [];
      _.each($scope.data.projectTagsToUnrelate, function(entity){
        entity.associationIds = _.difference(entity.associationIds, $scope.data.fileUuids);
        entity.value.files = _.difference(entity.value.files, $scope.data.fileUuids);
        tasks.push(ProjectEntitiesService.update({data: {
                                                      uuid: entity.uuid,
                                                      entity: entity}
                                                }).then(function(e){
                                                var ent = $scope.data.project.getRelatedByUuid(e.uuid);
                                                ent.update(e);
                                                return e;
                                                }));

      });
     _.each($scope.data.newFileProjectTags, function(entity){
        entity.associationIds = entity.associationIds.concat($scope.data.fileUuids);
        entity.value.files = entity.value.files.concat($scope.data.fileUuids);
        tasks.push(ProjectEntitiesService.update({data:{
                                                    uuid: entity.uuid,
                                                    entity: entity}
                                                }).then(function(e){
                                                var ent = $scope.data.project.getRelatedByUuid(e.uuid);
                                                ent.update(e);
                                                return e;
                                                }));
     });
     $scope.ui.busy = true;
     $q.all(tasks).then(
       function(e){
         $scope.data.newFileProjectTags = [];
         $scope.data.projectTagsToUnrelate = [];
         _setFileEntities();
         _setEntities();
         $scope.ui.parentEntities = currentState.project.getParentEntity($scope.data.files);
         $scope.ui.busy = false;
       }, function(er){
         $scope.ui.busy = false;
         $scope.ui.error = er;
       }
     );
    };

    $scope.addProjectTag = function(){
      var newTag = $scope.data.form.projectTagToAdd;
      var nameComps = newTag.tagType.split('.');
      var name = nameComps[nameComps.length-1];
      var entity = {};
      entity.name = newTag.tagType;
      if (name === 'event'){
        entity.eventType = newTag.tagAttribute;
      } else if (name === 'analysis'){
        entity.analysisType = newTag.tagAttribute;
      } else if (name === 'sensor_list'){
        entity.sensorListType = newTag.tagAttibute;
      } else if (name === 'model_config'){
        entity.coverage = newTag.tagAttribute;
      }
      for (var attr in $scope.data.form.projectTagToAdd.optional){
        entity[attr] = $scope.data.form.projectTagToAdd.optional[attr];
      }
      $scope.ui.addingTag = true;
      entity.title = newTag.tagTitle;
      entity.description = newTag.tagDescription || '';
      if (typeof $scope.data.files !== 'undefined'){
        entity.filePaths = _.map($scope.data.files,
                               function(file){
                                return file.path;
                               });
      }
      $scope.ui.addingTag = true;
      ProjectEntitiesService.create({data: {
          uuid: currentState.project.uuid,
          name: newTag.tagType,
          entity: entity
      }})
      .then(
         function(resp){
           $scope.data.form.projectTagToAdd = {optional:{}};
           currentState.project.addEntity(resp);
           _setFileEntities();
           _setEntities();
           $scope.ui.parentEntities = currentState.project.getParentEntity($scope.data.files);
           $scope.ui.error = false;
           $scope.ui.addingTag = false;
         },
         function(err){
           $scope.ui.error = true;
           $scope.error = err;
         }
     );
    };
  }]);
})(window, angular);
