
describe("FileListing", function() {
  var $httpBackend, $q, FileListing;
  beforeEach(angular.mock.module("portal"));
  beforeEach( ()=> {
    angular.module('django.context', []).constant('Django', {user: 'test_user'});
    angular.mock.inject(function(_$httpBackend_, _$q_, _FileListing_) {
      $httpBackend = _$httpBackend_;
      FileListing = _FileListing_;
      $q = _$q_;
    });
  });

  it("Should have a methods", function() {
    expect(FileListing.get).toBeDefined();
    expect(FileListing.init).toBeDefined();
    expect(FileListing.search).toBeDefined();
  });

  it("should handle init", ()=> {
    let options = {
        system: 'test-system',
        path: '/',
        name: '',
        directory: '/',
        queryString: '',
    };
    let listing = FileListing.init(options);
    expect(listing.system).toBeDefined();
    expect(listing.listingUrl()).toEqual("/api/data-depot/files/listing/my-data/test-system//");
    //file manager should be my-data for undefined api params
    expect(listing.fileMgr()).toEqual('my-data');
  });

  it("should handle a get", ()=> {
    var httpResponse;
    var data = {response: {
        "name": "test",
        "system": "test-system",
        "format": "folder",
        "children": [
            {
              "name": "test_child1.txt",
              "system": "test-system",
              "path": "/test_child1.txt"
            },
            {
              "name": "test_child2.txt",
              "system": "test-system",
              "path": "/test_child1.txt"
            }
        ]
    }};

    //Use a regex so that any query param will pass through
    $httpBackend.whenGET(/api\/data-depot\/files\/listing\/my-data\/test-system*/).respond(200, data);

    let options = {
        system: 'test-system',
        path: '/',
        name: '',
        directory: '/',
        queryString: '',
    };
    var listing;
    FileListing.get(options).then( (resp)=> {listing = resp;});
    $httpBackend.flush();
    expect(listing.system).toBeDefined();
    expect(listing.children.length).toEqual(2);
  });



});
