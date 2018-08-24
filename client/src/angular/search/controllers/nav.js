
export default class NavSearchCtrl {

  constructor (SearchService, $window) {
    'ngInject';
    this.SearchService = SearchService;
    this.$window = $window;
  }

  search(text) {
    this.$window.location.href = '/search?q='+text;
  }

}
