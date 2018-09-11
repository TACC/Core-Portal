import angular from 'angular';
import _ from 'underscore';

function SimpleList($http, $q, appCategories) {
  'ngInject';
  var SimpleList = function(){
    this.selected = null;
    this.lists = {};
    this.map = {};
    this.tabs = appCategories.concat(['My Apps']);
  };

  SimpleList.prototype.getDefaultLists = function() {
    var self = this;
    var deferred = $q.defer();
    $http({
      url: "/api/workspace/meta",
      method: 'GET'
    }).then(
      function(response){
        angular.forEach(self.tabs, function (tab) {
          self.lists[tab] = [];
        });

        const AGAVE_TENANT_BASEURL = (new URL(response.data.response[0]._links.owner.href)).hostname;

        angular.forEach(response.data.response, function (appMeta) {

          // If label is undefined, set as id
          if (!appMeta.value.definition.label) {
            appMeta.value.definition.label = appMeta.value.definition.id;
          }
          // Apply label for ordering
          appMeta.value.definition.orderBy = appMeta.value.definition.label;

          // Parse app icon
          if (appMeta.value.definition.hasOwnProperty('tags') && appMeta.value.definition.tags.filter(s => s.includes('appIcon')) !== undefined && appMeta.value.definition.tags.filter(s => s.includes('appIcon')).length != 0) {
            appMeta.value.definition.icon = appMeta.value.definition.tags.filter(s => s.includes('appIcon'))[0].split(':')[1];
          }

          // Is Public? NOTE: Only needed for tacc.prod tenant
          if (AGAVE_TENANT_BASEURL == "api.tacc.utexas.edu") {
            if (appMeta.value.definition.hasOwnProperty('tags') && appMeta.value.definition.tags.filter(s => s.includes('isPublic')) !== undefined && appMeta.value.definition.tags.filter(s => s.includes('isPublic')).length != 0) {
              appMeta.value.definition.isPublic = (appMeta.value.definition.tags.filter(s => s.includes('isPublic'))[0].split(':')[1] == 'true');
            }
          }
          
          if (appMeta.value.definition.isPublic) {
            // If App has no category, place in Simulation tab
            // Check if category exists in a tag.
            var appCategory = 'Simulation';
            if (appMeta.value.definition.hasOwnProperty('tags') && appMeta.value.definition.tags.filter(s => s.includes('appCategory')) !== undefined && appMeta.value.definition.tags.filter(s => s.includes('appCategory')).length != 0) {
              appCategory = appMeta.value.definition.tags.filter(s => s.includes('appCategory'))[0].split(':')[1];
            }
            if (appCategory in self.lists) {
              self.lists[appCategory].push(appMeta);
            } else {
              console.log(`No app category ${appCategory} found for ${appMeta.value.definition.id}.`);
              self.lists['Simulation'].push(appMeta);
            }
          } else {
              self.lists['My Apps'].push(appMeta);
          }
        });

        deferred.resolve(self);
      },
      function(apps){
        deferred.reject();
      }
    );
    return deferred.promise;
  };

  return SimpleList;
}

export default SimpleList;
