
export default class SearchViewCtrl {

  constructor (SearchService, $scope, $window, $location, $state) {
    'ngInject';
    $scope.SearchService = SearchService;
    $scope.data = {}
    $scope.$window = $window;
    $scope.$state = $state;
    $scope.$location = $location;
    $scope.query = $scope.$location.search();
    $scope.data.text = $scope.query.q;
    $scope.page_num = 0
    $scope.max_pages = 1;
    $scope.offset = 0;
    $scope.limit = 10;
    $scope.total_hits = 0;
    $scope.hits = {};
    $scope.data.type_filter = 'cms'
    $scope.prettyFilterName = {
      'cms': 'Web Content', 
      'private_files': 'My Data' ,
      'published': 'Published Projects', 
      'public_files': 'Public Files'
    }

    if ($scope.text) $scope.SearchService.search($scope.text);

    $scope.next = function () {
      $scope.page_num = $scope.page_num + 1;
      $scope.search();
    };

    $scope.prev = function () {
      $scope.page_num--;
      if ($scope.page_num < 0) $scope.page_num = 0;
      $scope.search();
    };

    $scope.filter = function(ftype) {
      $scope.data.type_filter = ftype;
      $scope.page_num = 0;
      $scope.search();
    }

    $scope.search = function(reset) {
      if (reset) {
        $scope.page_num = 0;
      }
      if ($scope.data.text) {
        $scope.offset = $scope.page_num * $scope.limit
        $scope.SearchService.search($scope.data.text, $scope.limit, $scope.offset, $scope.data.type_filter).then( (resp) => {
          $scope.data.search_results = resp.response
          //this.hits = resp.hits;
          console.log('in search callback.')
          console.log(resp);
          //$scope.data.hits = resp.hits;
          $scope.total_hits = $scope.data.search_results.total_hits
          $scope.max_pages = Math.ceil($scope.data.search_results.total_hits / $scope.limit)
        }); 
      } else { $scope.data.search_results = {} }
    };
  
    $scope.makeUrl = function(listing) {
      let url = $scope.$state.href('db.communityData', {systemId: listing.system, filePath:listing.path});
      //url='hello'
      return url;
    }


  }

  

}
