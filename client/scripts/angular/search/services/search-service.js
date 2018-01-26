
export default class SearchService {

  constructor($http) {
    'ngInject';
    this.$http = $http;
  }

  search(text) {
    return this.$http.get('/api/search/', {q: text}).then( (resp)=>{
      resp.data.response.forEach((d) => {
        d.lastModified = new Date(d.lastModified);
      });
      return resp.data.response;
    });
  }

}
