import resultTemplate from '../templates/search-result.html';

export default function searchResult() {
    return {
      restrict: 'E',
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
