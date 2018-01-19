export default function ddBreadcrumb() {
  return {
    restrict: 'E',
    templateUrl: '/static/portal/scripts/angular/data_depot/templates/dd-breadcrumb.html',
    scope: {
      listing: '=',
      skipRoot: '=',
      customRoot: '=',
      project: '=',
      onBrowse: '&',
      itemHref: '&'
    },
    link: function(scope) {
      scope.offset = 0;
      if (scope.skipRoot || scope.customRoot) {
        scope.offset = 1;
      }
    }
  };
}
