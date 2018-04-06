
export default class SearchService {

  constructor($http) {
    'ngInject';
    this.$http = $http;
  }

  search(text, limit, offset, type_filter) {
    return this.$http.get('/api/search', 
    {params: 
      {'q': text, 'limit': limit, 'offset': offset, 'type_filter': type_filter}
    }).then( (resp)=>{
    
      resp.data.response.hits.forEach((d) => {
        d.lastModified = new Date(d.lastModified);
      });

      return resp.data;
    });
  }

}
