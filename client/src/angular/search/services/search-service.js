export default class SearchService {

  constructor($http) {
    'ngInject';
    this.$http = $http;
  }

  search(text, limit, offset, type_filter, sortKey, sortOrder) {
    if (!type_filter) {
      type_filter = 'cms';
    }

    return this.$http
      .get('/api/search', {
        params: {
          'queryString': text,
          'limit': limit,
          'offset': offset,
          'typeFilter': type_filter,
          'sortKey': sortKey,
          'sortOrder': sortOrder
        }
      })
      .then(
        (resp) => {
          resp.data.response.hits.forEach((d) => {
            d.lastModified = new Date(d.lastModified);
          });

          return resp.data;
        },
        (err) => {
          return this.$q.reject(err);
        }
      );
  }
}
