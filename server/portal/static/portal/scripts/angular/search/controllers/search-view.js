
export default class SearchViewCtrl {

  constructor (SearchService, $window, $location, $state) {
    'ngInject';
    this.SearchService = SearchService;
    this.$window = $window;
    this.$state = $state;
    this.$location = $location;
    this.query = this.$location.search();
    this.text = this.query.q;
    if (this.text) this.search(this.text);
  }

  search(text) {
    this.SearchService.search(text).then( (resp) => {
      this.results = resp;
    });
  }

  makeUrl(listing) {
    let url = this.$state.href('db.communityData', {systemId: listing.system, filePath:listing.path});
    return url;
  }

}
