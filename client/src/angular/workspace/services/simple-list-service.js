import angular from 'angular';
import _ from 'underscore';

function SimpleList($http, $q, appCategories) {
  'ngInject';
  var SimpleList = function(){
    this.selected = null;
    this.lists = {};
    this.map = {};
    this.tabs = appCategories.concat(['My Apps']);
    angular.forEach(this.tabs, (tab)=> {
      this.lists[tab] = [];
    });
  };

  SimpleList.prototype.getPrivate = function () {
    var self=this;
    return $http({
      url: '/api/workspace/apps',
      method: "GET",
      params: {"private": "true"}
    }).then( (resp)=> {
      let apps = resp.data.response;
      //this munges the standard agave apps list into
      //something that looks like a metadata listing so that
      //the UI can handle it the same way
      let wrapped = apps.map((d)=> {
        return {
          value: {
            type: "agave",
            definition: d
          }
        };
      });
      self.lists['My Apps'] = wrapped;
    });
  };


  SimpleList.prototype.getDefaultLists = function() {
    var self = this;
    var deferred = $q.defer();
    $http({
      url: "/api/workspace/meta",
      method: 'GET'
    }).then(
      function(response){
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
