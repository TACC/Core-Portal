import * as resultTempalte from '../templates/search-result.html';

export default function searchResult() {
    return {
      restrict: 'E',
      scope: {
        listing: '=data',
        click: '&click',
        makeUrl: '&makeUrl'
      },
      template: resultTempalte,
      //templateUrl: '/static/src/angular/search/templates/search.html',
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
