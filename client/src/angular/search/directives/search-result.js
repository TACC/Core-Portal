import resultTemplate from '../templates/search-result.html';

// TODO: Convert to component.

export default function searchResult() {
  return {
    restrict: 'EA',
    scope: {
      listing: '=data',
      route: '=',
      click: '&click',
      makeUrl: '&makeUrl'
    },
    template: resultTemplate,
    link: function ($scope, elem, attrs) {
      $scope.onClick = function (listing) {
        $scope.click(listing);
      };
      $scope.url = function (listing) {
        return $scope.makeUrl(listing);
      };
    }
  };
}
