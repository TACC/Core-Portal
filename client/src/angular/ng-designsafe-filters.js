import angular from 'angular';

let mod = angular.module('portal.filters', []);

mod.filter('bytes', function() {
  return function(bytes, precision) {
    if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
    if (typeof precision === 'undefined') precision = 1;
    var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
    var number = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
  };
});

mod.filter('agaveperms', function () {
  return function (pems) {
    const options = {
      'READ': 'Read',
      'WRITE': 'Write',
      'READ_WRITE': 'Read/Write',
      'READ_EXECUTE': 'Read/Execute',
      'WRITE_EXECUTE': 'Write/Execute',
      'ALL': 'All',
      'NONE': 'none'
    };

    return options[pems];
  };
});

mod.filter('keys', function() {
  return function(obj) {
    if (typeof obj === 'object') {
      return Object.keys(obj);
    }
    return [];
  };
});

mod.filter('length', function() {
  return function(obj) {
    if (typeof obj === 'object') {
      if (obj instanceof Array) {
        return obj.length;
      }
      return Object.keys(obj).length;
    } else if (typeof obj === "string") {
      return obj.length;
    } else if (typeof obj === "number") {
      return String(obj).length;
    }
    return 0;
  };
});

mod.filter('toTrusted', function ($sce) {
  return function (value) {
      return $sce.trustAsHtml(value);
  };
});

export default mod;
