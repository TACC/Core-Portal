export default function DataDepotNavCtrl($scope, $rootScope, $state, Django, SystemsService) {
  'ngInject';
  $scope.routerItems = [];
  SystemsService.listing().then(function (resp) {
    var com_data = _.find(resp, {name: 'Community Data'});
    var my_data = _.find(resp, {name: "My Data"});
    $scope.routerItems.push(
      {
        name: 'My Data',
        collapsible: false,
        state: 'db.myData({systemId:"' + my_data.systemId +'", filePath:""})',
        description: 'Private directory for your data',
        icon: 'fa-user'
      }
    );
    $scope.routerItems.push(
        {
          name: 'My Projects',
          collapsible: false,
          state: 'db.projects.list',
          description: 'Group access to shared directories',
          icon: 'fa-briefcase'
        }
    );
    $scope.routerItems.push(
        {
          name: 'Community Data',
          collapsible: false,
          state: 'db.communityData({systemId:"' + com_data.systemId + '", filePath:"/"})',
          description: 'Non-curated user-contributed data',
          icon: 'fa-users'
        }
    );
  });

}
