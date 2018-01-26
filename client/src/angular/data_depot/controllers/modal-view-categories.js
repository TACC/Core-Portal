(function(window, angular) {
  var app = angular.module('designsafe');

  app.controller('ModalViewCategories', ['$uibModalInstance', '$scope', 'file',
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
                   fileSubTags: {},
                   fileSubTagsDesc: {}};

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

    $scope.isFileSubTagValid = function(file, entity){
      return typeof entity.getFileSubTag(file) !== 'undefined';
    };

    $scope.getFileSubTag = function(file, entity){
        var tags = entity.value.tags;
        var tag;
        var equal = function(val){
            return val === file.uuid();
        };
        var predicate = function(item){
            return _.findIndex(item.file, equal) > -1;
        };
        for (var t in tags){
            for(var st in tags[t]){
                var _tag = _.find(tags[t][st], predicate);
                if (_tag){
                    tag = {tag: st, desc: _tag.desc};
                }
            }
        }
        return tag;
    };

    $scope.saveFileTags = function(){
      var sttasks = [];
      var updateFn = function(e){
                  var ent = $scope.data.project.getRelatedByUuid(e.uuid);
                  ent.update(e);
                  };
      for (var euuid in $scope.data.fileSubTags){
        var sts = $scope.data.fileSubTags[euuid] || [];
        var entity = currentState.project.getRelatedByUuid(euuid);
        for (var fuuid in sts){
          if (sts[fuuid] == 'none'){
            continue;
          }
          if (typeof entity.value.tags[sts[fuuid].tagType][sts[fuuid].name] !== 'undefined' &&
              _.isArray(entity.value.tags[sts[fuuid].tagType][sts[fuuid].name])){

            if ($scope.data.fileSubTagsDesc[euuid] && $scope.data.fileSubTagsDesc[euuid][fuuid]){
              entity.value.tags[sts[fuuid].tagType][sts[fuuid].name].push(
                  {file: [fuuid], desc: $scope.data.fileSubTagsDesc[euuid][fuuid]});
            } else {
              entity.value.tags[sts[fuuid].tagType][sts[fuuid].name].push(
                  {file: [fuuid]});
            }
          } else {
            if ($scope.data.fileSubTagsDesc[euuid] && $scope.data.fileSubTagsDesc[euuid][fuuid]){
              entity.value.tags[sts[fuuid].tagType][sts[fuuid].name] = [{file: [fuuid], desc: $scope.data.fileSubTagsDesc[euuid][fuuid]}];
            } else {
              entity.value.tags[sts[fuuid].tagType][sts[fuuid].name] = [{file: [fuuid]}];
            }
          }

          sttasks.push(ProjectEntitiesService.update(
                  {data: {uuid: entity.uuid, entity:entity}}).then(updateFn));
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
         name: 'designsafe.project.model_config',
         yamzId: 'h1312'},
        {label: 'Sensor Info',
         name: 'designsafe.project.sensor_list',
         yamzId: 'h1557'},
        {label: 'Event',
         name: 'designsafe.project.event',
         yamzId: 'h1253'},
        {label: 'Analysis',
         name: 'designsafe.project.analysis',
         yamzId: 'h1333'},
        {label: 'Report',
         name: 'designsafe.project.report',
         yamzId: ''}
        ];
    $scope.data.form.projectTagToAdd = {optional:{}};
    $scope.data.catForm = {};

    $scope.isProjectTagSel = function(entity){
      if (_.findWhere($scope.data.newFileProjectTags, {uuid: entity.uuid})){
        return true;
      } else if (_.findWhere($scope.data.projectTagsToUnrelate, {uuid: entity.uuid})){
        return false;
      } else if ( _.findWhere($scope.data.fileProjectTags, {uuid: entity.uuid})){
        return true;
      } else if ( _.findWhere($scope.ui.parentEntities, {uuid: entity.uuid})){
        return true;
      }
      return false;
    };

    $scope.isProjectTagDirectlyRelated = function(entity){
      for(var fi = 0; fi < files.length; fi++){
        if (entity.isRelatedToFile(files[fi])){
            return true;
        }
      }
      return false;
    };

    $scope.isEntityLocked = function(entity){
      return $scope.isProjectTagSel(entity) && !$scope.isProjectTagDirectlyRelated(entity) &&
             _.findWhere($scope.ui.parentEntities, {uuid: entity.uuid});
    };

    $scope.toggleProjectTag = function(entity){
      if (_.findWhere($scope.ui.parentEntities, {uuid: entity.uuid}) &&
          $scope.isProjectTagSel(entity) &&
          !$scope.isProjectTagDirectlyRelated(entity)){
        return;
      }
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

    $scope.unrelateFile = function(file, entity){
      entity.associationIds = _.difference(entity.associationIds, [file.uuid()]);
      entity.value.files = _.difference(entity.value.files, [file.uuid()]);
      $scope.ui.busy = true;
      ProjectEntitiesService.update({data: {uuid: entity.uuid,
                                            entity: entity}
                                    }).then(function(e){
                                      var ent = currentState.project.getRelatedByUuid(e.uuid);
                                      ent.update(e);
                                      return e;
                                     }).then(function(){
         $scope.data.newFileProjectTags = [];
         $scope.data.projectTagsToUnrelate = [];
                                         _setFileEntities();
                                         _setEntities();
         $scope.ui.parentEntities = currentState.project.getParentEntity($scope.data.files);
                                         $scope.ui.busy = false;
                                     });
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

    $scope.openEditCategory = function(){
        var cat = $scope.data.newFileProjectTags[0];
        $scope.data.catForm = {
            entity: cat,
            type: cat._displayName,
            title: cat.value.title,
            description: cat.value.description
        };
        $scope.ui.showEditCategory = true;
    };

    $scope.saveEditCategory = function(){
        var cat = $scope.data.catForm.entity;
        cat.value.title = $scope.data.catForm.title;
        cat.value.description = $scope.data.catForm.description;
        $scope.ui.editFormSaving = true;
        ProjectEntitiesService.update({data: {
                                  uuid: cat.uuid,
                                  entity: cat
                                }}).then(function(e){
                                    var ent = $scope.data.project.getRelatedByUuid(e.uuid);
                                    ent.update(e);
                                    $scope.ui.editFormSaving = false;
                                    $scope.data.catForm = {};
                                    $scope.ui.showEditCategory = false;
                                    return e;
                                });
    };

    $scope.deleteCategory = function(){
        $scope.ui.busy = true;
        var entity = $scope.data.newFileProjectTags[0];
        ProjectEntitiesService.delete({
            data: {
                uuid: entity.uuid
            }
        }).then(function(entity){
            $scope.data.project.removeEntity(entity);
            _setFileEntities();
            _setEntities();
            $scope.ui.busy = false;
        }, function(err){
            $scope.ui.busy = false;
            $scope.ui.error = err;
            $scope.data.newFileProjectTags = [];
        });
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
