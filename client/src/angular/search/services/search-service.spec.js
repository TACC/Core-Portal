// import SearchService from './search-service';

// let service;

describe("SearchService", function() {
  var SearchService, $httpBackend;
  beforeEach(angular.mock.module("portal"));
  beforeEach( ()=> {
    angular.module('django.context', []).constant('Django', {user: 'test_user'});
    angular.mock.inject(function(_$httpBackend_, _SearchService_) {
      SearchService = _SearchService_;
      $httpBackend = _$httpBackend_;

    });
  });

  it("Should have a search method", function() {
    expect(SearchService.search).toBeDefined();
  });

  it("should handle a search response", ()=> {
    var httpResponse;
    let data = {response: {
      hits: [
        {"title": "test", "lastModified": "2018-01-01"},
        {"title": "test", "lastModified": "2018-02-01"}
      ]
    }};

    //Use a regex so that any query param will pass through
    $httpBackend.whenGET(/api\/search*/).respond(200, data);
    SearchService.search("test", 100, 0, 'cms').then( resp => {
      httpResponse = resp;
    });
    $httpBackend.flush();
    expect(httpResponse.response.hits.length).toEqual(2);
    let result1 = httpResponse.response.hits[0];
    // have to compare date times, not objects
    expect(result1.lastModified.getTime()).toEqual(new Date("2018-01-01").getTime());

  });



});
