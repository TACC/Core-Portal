
export default class SearchViewCtrl {

  constructor (SearchService, $window, $location, $state) {
    'ngInject';
    this.SearchService = SearchService;
    this.data = {};
    this.$window = $window;
    this.$state = $state;
    this.$location = $location;
  }

  $onInit() {
    this.query = this.$location.search();
    this.data.text = this.query.q;
    this.page_num = 0;
    this.max_pages = 1;
    this.offset = 0;
    this.limit = 10;
    this.total_hits = 0;
    this.hits = {};
    this.data.type_filter = this.$state.params.type_filter;
    this.data.text = this.$state.params.query_string;
    this.prettyFilterName = {
      'cms': 'Web Content',
      'private_files': 'My Data' ,
      'published': 'Published Projects',
      'public_files': 'Public Files'
    };
    if (this.data.text) {
      this.search(true);
    }
  }

  next () {
    this.page_num = this.page_num + 1;
    this.search();
  };

  prev () {
    this.page_num--;
    if (this.page_num < 0) this.page_num = 0;
    this.search();
  };

  filter(ftype) {
    this.data.type_filter = ftype;
    this.page_num = 0;
    this.search_browse(false);
  };

  search_browse(switch_filter) {
    this.$state.go('wb.search', {'query_string': this.data.text, 'type_filter': this.data.type_filter, 'switch_filter': switch_filter});
  };

  search(reset) {
    if (reset) {
      this.page_num = 0;
    }
    if (this.data.text) {
      this.offset = this.page_num * this.limit;

      return this.SearchService
        .search(this.data.text, this.limit, this.offset, this.data.type_filter)
        .then( (resp) => {
          this.data.search_results = resp.response;
          //this.data.hits = resp.hits;
          this.total_hits = this.data.search_results.total_hits;
          this.max_pages = Math.ceil(this.data.search_results.total_hits / this.limit);
          if (this.data.search_results.filter != this.data.type_filter && this.$state.params.switch_filter) {
            this.data.type_filter = this.data.search_results.filter;
            this.search_browse(true);
          }

        });
    }
    this.data.search_results = {};
    return this.data.search_results;
  };

  ddSystemRoute() {
    switch(this.data.type_filter) {
      case 'private_files':
        return 'agave';
        break;
      case 'public_files':
        return 'public';
        break;

    }
    return 0;
  };

  makeUrl(listing) {
    let url = this.$state.href('wb.data_depot.db', {systemId: listing.system, filePath:listing.path});
    return url;
  };



}  // Close class.
