import ddBreadcrumbTemplate from '../templates/dd-breadcrumb.html';

export default function ddBreadcrumb() {
  return {
    restrict: 'E',
    template: ddBreadcrumbTemplate,
    scope: {
      listing: '=',
      skipRoot: '=',
      customRoot: '=',
      project: '=',
      onBrowse: '&',
      itemHref: '&'
    },
    link: function(scope) {
      console.log(scope.listing)
      scope.offset = 0;
      if (scope.skipRoot || scope.customRoot) {
        scope.offset = 1;
      }
    }
  };
}
