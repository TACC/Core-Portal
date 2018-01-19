function SimpleList ($http, $q) {
  'ngInject';
  var SimpleList = function(){
    this.selected = null,
    this.lists = {},
    this.map = {};
  };

  SimpleList.prototype.getDefaultLists = function(query) {
    var self = this;
    var deferred = $q.defer();
    $http({
      url: "/api/workspace/meta",
      method: 'GET',
      params: {'q': query}
    }).then(
      function(response){
        self.lists['Private'] = [];
        self.lists['Public'] = [];


        angular.forEach(response.data.response, function(appMeta){
          self.map[appMeta.value.definition.id] = appMeta;
          if (appMeta.value.definition.isPublic){
            if (appMeta.value.definition.available){
              self.lists['Public'].push(
                appMeta
              );
            }
          } else {
            if (appMeta.value.definition.available){
              self.lists['Private'].push(
                appMeta
              );
            }
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

  SimpleList.prototype.getUserLists = function(query) {
    var self = this;
    var deferred = $q.defer();

    $http({
      url: '/api/workspace/meta',
      method: 'GET',
      params: {'q': query}
    }).then(
      function(response){
        if (response.data.response.length > 0){
          _.each(response.data.response, function(appListMeta){
            self.lists[appListMeta.value.label] = [];
            _.each(appListMeta.value.apps, function(app){
              self.lists[appListMeta.value.label].push(self.map[app.value.definition.id]);
            });
          });
        }
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
