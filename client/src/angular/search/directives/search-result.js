export default function searchResult() {
    return {
      restrict: 'E',
      scope: {
        listing: '=data',
        click: '&click',
        makeUrl: '&makeUrl'
      },
      templateUrl: '/static/portal/scripts/angular/search/templates/search-result.html',
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
