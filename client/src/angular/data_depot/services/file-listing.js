import angular from 'angular';
import _ from 'underscore';


function FileListing($http, $q) {
  'ngInject';

  function Listing(json, apiParams) {
    angular.extend(this, json);

    // wrap children as Listing instances
    if (this.children && this.children instanceof Array) {
      this.children = _.map(this.children, function (child) {
        var fl = new Listing(child);
        fl._parent = this;
        return fl;
      }, this);
    }
    if (typeof apiParams !== 'undefined' &&
        apiParams !== null &&
        !_.isEmpty(apiParams)){
      this.apiParams = apiParams;
    }
    if (typeof this._entities === 'undefined'){
      this._entities = [];
    }
    if (typeof this._entityTags === 'undefined'){
      this._entityTags = [];
    }
  }

  Listing.prototype.setEntities = function(projectId, entities){
    var self = this;
    var path = self.path;
    self._entities = [];
    _.each(entities, function(entity){
      if (typeof entity !== 'undefined' &&
          typeof entity._links !== 'undefined' &&
          typeof entity._links.associationIds !== 'undefined'){
        _.each(entity._links.associationIds, function(asc){
          if (asc.title === 'file'){
            var comps = asc.href.split('project-' + projectId, 2);
            if ( comps.length === 2 &&
                 path.replace(/^\/+/, '') === comps[1].replace(/^\/+/, '')){
              self._entities.push(entity);
            }
          }
        });
      }
    });
    if(self._entities.length){
      self._entities = _.uniq(self._entities, function(e){ return e.uuid;});
      var myAsoc = _.find(self._entities[0]._links.associationIds,
        function(asc){
        if (asc.title === 'file'){
          var comps = asc.href.split('project-' + projectId, 2);
          return self.path.replace(/^\/+/, '') === comps[1].replace(/^\/+/, '');
        }
        return '';
      });
      if (myAsoc){
        var myUuid = myAsoc.rel;
        _.each(self._entities, function(entity){
          if( _.contains(entity.value.modelDrawing || [], myUuid)){
            self._entityTags.push('Model Drawing');
          }
          else if (_.contains(entity.value.load || [], myUuid)){
            self._entityTags.push('Load');
          }
          else if (_.contains(entity.value.sensorDrawing || [], myUuid)) {
            self._entityTags.push('Sensor Drawing');
          }
          else if(_.contains(entity.value.script || [], myUuid)) {
            self._entityTags.push('Script');
          }
        });
      }
      self._entityTags = _.uniq(self._entityTags);
    }
  };

  Listing.prototype.uuid = function(){
    try{
      var parser = document.createElement('a');
      parser.href = decodeURIComponent(this._links.metadata.href);
      var q = parser.search.substring(3);
      var uuid = JSON.parse(decodeURIComponent(q)).associationIds;
      return uuid;
    }
    catch(e){
      return '';
    }
  };

  Listing.prototype.parentPath = function(){
    var pathComps = this.path.split('/');
    return pathComps.slice(0, pathComps.length - 1).join('/');
  };

  Listing.prototype.fileMgr = function(){
    if (typeof this.apiParams !== 'undefined' &&
        this.apiParams !== null &&
        !_.isEmpty(this.apiParams)){
      return this.apiParams.fileMgr;
    }
    return 'my-data';
  };

  Listing.prototype._baseUrl = function(){
    if (typeof this.apiParams !== 'undefined' &&
        this.apiParams !== null &&
        !_.isEmpty(this.apiParams)){
      return this.apiParams.baseUrl;
    }
    return '/api/data-depot/files';
  };

  Listing.prototype.listingUrl = function () {
    var urlParts = [this._baseUrl(), 'listing', this.fileMgr()];
    if (this.system) {
      urlParts.push(this.system);
    }
    if (this.id && this.id.indexOf('/') > -1){
      urlParts.push(this.id);
    }
    else if (this.path) {
      urlParts.push(this.path);
    }
    return urlParts.join('/');
  };

  Listing.prototype.mediaUrl = function () {
    var urlParts = [this._baseUrl(), 'media', this.fileMgr()];
    if (this.system){
      urlParts.push(this.system);
    }
    if (this.id && this.id.indexOf('/') > -1){
      urlParts.push(this.id);
    }
    else if (this.path) {
      urlParts.push(this.path);
    }
    return urlParts.join('/');
  };

  Listing.prototype.pemsUrl = function () {
    var urlParts = [this._baseUrl(), 'pems', this.fileMgr()];
    if (this.system){
      urlParts.push(this.system);
    }
    if (this.id && this.id.indexOf('/') > -1){
      urlParts.push(this.id);
    }
    else if (this.path) {
      urlParts.push(this.path);
    }
    return urlParts.join('/');
  };

  Listing.prototype.metaUrl = function () {
    var urlParts = [this._baseUrl(), 'meta', this.fileMgr()];
    if (this.system){
      urlParts.push(this.system);
    }
    if (this.id && this.id.indexOf('/') > -1){
      urlParts.push(this.id);
    }
    else if (this.path) {
      urlParts.push(this.path);
    }
    return urlParts.join('/');
  };

  Listing.prototype.searchUrl = function () {
    var urlParts = [this._baseUrl(), 'search', this.fileMgr()];
    if (this.system){
      urlParts.push(this.system);
    }
    return urlParts.join('/');
  };

  Listing.prototype.agaveUri = function() {
    return 'agave://' + this.system + '/' + this.path;
  };

  /**
   * Make a copy of this FileResource.
   *
   * @param {object} options
   * @param {string} [options.path] The path to copy to
   * @param {string} [options.name] The new name for the copy
   * @returns {*}
   */
  Listing.prototype.copy = function (options) {
    var self = this;
    var body = {
      "action": "copy",
      "system": options.system,
      "path": options.path,
      "name": options.name,
      "resource": options.resource || ""
    };

    return $http.put(this.mediaUrl(), body).then(function (resp) {
      var newCopy = new Listing(resp.data.response);
      if (options.path == self._parent.path) {
        self._parent.children.push(newCopy);
      }
      return newCopy;
    }, function (err) {
      return $q.reject(err.data);
    });
  };

  Listing.prototype.download = function () {
    var body = {
      "action": "download"
    };
    return $http.put(this.mediaUrl(), body).then(function (resp) {
      return resp.data;
    }, function (err) {
      return $q.reject(err.data);
    });
  };

  Listing.prototype.search = function(params) {
    var self = this;
    return $http.get(this.searchUrl(), {params: params}).then(function(res){
      angular.extend(self, res.data);
      if (self.children && self.children instanceof Array) {
        self.children = _.map(self.children, function (child) {
          var fl = new Listing(child, self.apiParams);
          fl._parent = self;
          return fl;
        }, self);
      }
      return self;
    }, function (err) {
      return $q.reject(err.data);
    });
  };

  Listing.prototype.fetch = function (params) {
    var self = this;

    var stopper = $q.defer();
    var req = $http.get(this.listingUrl(), {params: params, timeout:stopper.promise}).then(function (resp) {
      angular.extend(self, resp.data.response);

      // wrap children as Listing instances
      if (self.children && self.children instanceof Array) {
        self.children = _.map(self.children, function (child) {
          var fl = new Listing(child, self.apiParams);
          fl._parent = self;
          return fl;
        }, self);
      }

      return self;
    }, function (err) {
      return $q.reject(err);
    });
    req.stopper = stopper;
    return req;
  };

  Listing.prototype.getMeta = function() {
    var self = this;
    return $http.get(this.metaUrl()).then(function (resp){
      angular.extend(self, resp.data);
      return self;
    }, function (err) {
      return $q.reject(err.data);
    });
  };

  Listing.prototype.updateMeta = function(metaObj){
    var self = this;
    return $http.put(this.metaUrl(), metaObj).then(function (resp){
      angular.extend(self, resp.data);
      return self;
    }, function (err) {
      return $q.reject(err.data);
    });
  };

  Listing.prototype.icon = function() {
    if (this.type === 'dir' || this.type === 'folder') {
      return 'fa-folder';
    }

    var icon;
    var ext = this.name.split('.').pop().toLowerCase();
    switch (ext) {
      case 'zip':
      case 'tar':
      case 'gz':
      case 'bz2':
        icon = 'fa-file-archive-o';
        break;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'tif':
      case 'tiff':
        icon = 'fa-file-image-o';
        break;
      case 'pdf':
        icon = 'fa-file-pdf-o';
        break;
      case 'doc':
      case 'docx':
        icon = 'fa-file-word-o';
        break;
      case 'xls':
      case 'xlsx':
        icon = 'fa-file-excel-o';
        break;
      case 'ppt':
      case 'pptx':
        icon = 'fa-file-powerpoint-o';
        break;
      case 'mov':
      case 'mp4':
        icon = 'fa-file-video-o';
        break;
      case 'mp3':
      case 'wav':
        icon = 'fa-file-audio-o';
        break;
      case 'txt':
      case 'out':
      case 'err':
        icon = 'fa-file-text-o';
        break;
      case 'tcl':
      case 'sh':
      case 'json':
        icon = 'fa-file-code-o';
        break;
      default:
        icon = 'fa-file-o';
    }
    return icon;
  };

  /**
   * Make a new child directory.
   *
   * @param {object} options
   * @param {string} options.name The name for the new directory
   */
  Listing.prototype.mkdir = function (options) {
    if (this.type !== 'dir') {
      throw new Error('Listing.mkdir can only be called for "dir" type Listings.');
    }

    var self = this;
    var body = {
      "action": "mkdir",
      "name": options.name
    };
    return $http.put(this.mediaUrl(), body).then(function (resp) {
      var newDir = new Listing(resp.data.response);
      self.children.push(newDir);
      return newDir;
    }, function (err) {
      return $q.reject(err.data);
    });
  };

  /**
   * Move a file to a new location.
   *
   * @param {object} options
   * @param {string} options.path The path of the destination directory for the operation
   * @param {string} [options.name] An optional new name for the moved file
   * @returns {*}
   */
  Listing.prototype.move = function (options) {
    var self = this;
    var body = {
      "action": "move",
      "system": options.system,
      "path": options.path,
      "name": options.name
    };
    return $http.put(this.mediaUrl(), body).then(function (resp) {
      var newDir = new Listing(resp.data);
      /* remove this file from previous parent's children */
      if (self._parent) {
        self._parent.children = _.reject(self._parent.children, function (child) {
          return child.path === self.path;
        });
        self._parent = undefined;
      }
      return newDir;
    }, function (err) {
      return $q.reject(err.data);
    });
  };

  /**
   * Get the permissions for this Listing.
   *
   * @return {Promise}
   */
  Listing.prototype.listPermissions = function() {
    if (this._permissions) {
      return $q.resolve(this._permissions);
    }
    var self = this;
    return $http.get(this.pemsUrl()).then(function (resp) {
      self._permissions = resp.data;
      return self._permissions;
    }, function (err) {
      return $q.reject(err.data);
    });
  };

  /**
   * Request a preview of the file. Returns a promise that will be resolved
   * with an object with a single attribute `href` where the preview can be
   * fetched. If a preview is unavailable the promise will be rejected.
   *
   * @return {Promise}
   */
  Listing.prototype.preview = function () {
    var body = {
      "action": "preview"
    };
    return $http.put(this.mediaUrl(), body).then(function (resp) {
      return resp.data.response;
    }, function (err) {
      return $q.reject(err.data);
    });
  };

  /**
   * Rename a file. Implicitly, this is a move operation with the same path and a new
   * name.
   *
   * @param {object} options
   * @param {string} options.name The new name for this file.
   * @returns {Promise}
   */
  Listing.prototype.rename = function (options) {
    var self = this;
    var body = {
      "action": "rename",
      "name": options.name
    };
    return $http.put(this.mediaUrl(), body).then(function (resp) {
      /* update self */
      angular.extend(self, resp.data.response);
      return self;
    }, function (err) {
      return $q.reject(err.data);
    });
  };


  /**
   * Removes the current file
   *
   * @return {Promise}
   */
  Listing.prototype.rm = function () {
    var self = this;
    return $http.delete(this.mediaUrl()).then(function (resp) {
      /* remove from self._parent.children */
      if (self._parent) {
        self._parent.children = _.reject(self._parent.children, function (child) {
          return child.path === self.path;
        });
      }
    }, function (err) {
      return $q.reject(err.data);
    });
  };

  /**
   * Update sharing permissions on a file according to the given options.
   *
   * @param {object} options
   * @param {string} options.username The username of the user whose permissions to update
   * @param {string} options.permission The new permission value
   */
  Listing.prototype.share = function (options) {
    return $http.post(this.pemsUrl(), options).then(function (resp) {
      return resp.data;
    }, function (err) {
      return $q.reject(err.data);
    });
  };


  /**
   * This is much like move, except with the implicit destination path of ~/.Trash.
   * This also will rename the file if a file with the same name already exists in
   * ~/.Trash.
   *
   * @returns {Promise}
   */
  Listing.prototype.trash = function () {
    var self = this;
    var body = {
      "action": "trash"
    };
    return $http.put(this.mediaUrl(), body).then(function (resp) {
      var trashed = new Listing(resp.data.response);

      /* remove this file from previous parent's children */
      if (self._parent) {
        self._parent.children = _.reject(self._parent.children, function (child) {
          return child.path === self.path;
        });
        self._parent = undefined;
      }
      if (trashed.name !== self.name) {
        // TODO notify user via Toastr
        window.alert('File was renamed to "' + trashed.name + '".');
      }
      return trashed;
    });
  };

  /**
   * Upload as a new file
   * @param {FormData} data The Multipart FormData
   */
  Listing.prototype.upload = function (data) {
    return $http.post(this.mediaUrl(), data, {headers: {'Content-Type': undefined}})
      .then(function (result) {
        return result.data;
      }, function (err) {
        return $q.reject(err.data);
      });
  };


  // function FilePermission(json) {
  //   angular.extend(this, json);
  // }
  //
  //
  // FilePermission.prototype.permissionBit = function () {
  //   if (this.permission.read) {
  //     if (this.permission.write) {
  //       if (this.permission.execute) {
  //         return 'ALL';
  //       }
  //       return 'READ_WRITE';
  //     }
  //     return 'READ';
  //   } else if (this.permission.write) {
  //     if (this.permission.execute) {
  //       return 'WRITE_EXECUTE';
  //     }
  //     return 'WRITE';
  //   } else if (this.permission.execute) {
  //     return 'EXECUTE';
  //   }
  //   return 'NONE';
  // };

  /**
   *
   * @param {object} options
   * @param {string} options.system
   * @param {string} options.path
   * @returns {Promise}
   */
  function get(options, apiParams, params) {
    var req;
    var fl = new Listing(options, apiParams);
    if (params){
      req = fl.fetch(params) ;
    } else {
      req = fl.fetch();
    }
    return req;
  }

  function init(obj, apiParams){
      return new Listing(obj, apiParams);
  }

  /**
   * @param {object} options
   * @param {string} options.system
   * @param {string} options.q
   * @param {int} options.offset
   * @param {int} options.limit
   */
  function search(options, apiParams){
    var fl = new Listing(options, apiParams);
    return fl.search(options);
  }


  /**
   * Public API
   */
  return {
    get: get,
    search: search,
    init: init
  };

}

export default FileListing;
