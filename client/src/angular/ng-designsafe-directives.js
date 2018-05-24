import angular from 'angular';
import $ from 'jquery';

let mod = angular.module('portal.directives', []);

mod.directive('iframeOnload', [
  function() {
    return {
      scope: {
        callBack: '&iframeOnload'
      },
      link: function(scope, element, attrs) {
        element.on('load', function() {
          return scope.callBack();
        });
      }
    };
  }
]);

mod.directive('fileModel', [
  '$parse',
  function($parse) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var model = $parse(attrs.fileModel);
        var modelSetter = model.assign;
        element.bind('change', function() {
          scope.$apply(function() {
            if (attrs.multiple) {
              modelSetter(scope, element[0].files);
            } else {
              modelSetter(scope, element[0].files[0]);
            }
          });
        });
      }
    };
  }
]);

mod.directive('spinnerOnLoad', function() {
  return {
    restrict: 'A',
    link: function(scope, element) {
      element.parent().prepend("<div class='text-center spinner'><i class='fa fa-spinner fa-pulse fa-3x fa-fw'></i></div>");
      element.css('display', 'none');
      element.on('load', function(ev) {
        element.parent().find(".spinner").remove();
        element.css('display', 'block');
      });
    }
  };
});

mod.directive('httpSrc', [
  '$http',
  function($http) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var conf = {
          responseType: 'arraybuffer'
        };
        $http.get(attrs.httpSrc, conf).success(function(data) {
          var arr = new Uint8Array(data);
          var raw = '';
          var i,
            j,
            subArray,
            chunk = 5000;
          for (i = 0, j = arr.length; i < j; i += chunk) {
            subArray = arr.subarray(i, i + chunk);
            raw += String.fromCharCode.apply(null, subArray);
          }
          var b64 = btoa(raw);
          attrs.$set('src', "data:image/jpeg;base64," + b64);
        }).error(function(error) {
          console.log(error);
        });
      }
    };
  }
]);

mod.directive('accessfiles', function() {
  return {
    scope: {
      accessfiles: '='
    },
    link: function(scope, element, attributes) {
      element.bind('change', function(event) {
        scope.$apply(function() {
          scope.accessfiles = event.target.files;
        });
      });
    }
  };
});

mod.directive('selectOnFocus', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      element.on('focus', function() {
        this.select();
      });
    }
  };
});

mod.directive('dsDataDraggable', function() {
  function dragStart(e) {
    var ele = this;
    ele.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'copyLink';
    e.dataTransfer.setData('text/plain', ele.getAttribute('data-ds-data'));
    this.classList.add('drag');
  }

  function dragOver(e) {
    e.preventDefault();
    var ele = this;
    ele.style.opacity = '1';
  }

  function onDrop(e) {
    e.stopPropagation();
    var ele = this;
    ele.style.opacity = '1';
  }

  function dataDraggable($scope, $element) {
    var el = $element[0];
    el.draggable = true;
    el.addEventListener('dragstart', dragStart);
    el.addEventListener('dragover', dragOver);
    el.addEventListener('dragend', dragOver);
    el.addEventListener('drop', onDrop);
  }
  return dataDraggable;
});

mod.directive('dsDraggable', function() {
  return {
    restrict: 'A',
    scope: {
      transferData: '=dsDragTransfer',
      dragStart: '&dsDragStart',
      dragEnter: '&dsDragEnter',
      dragOver: '&dsDragOver',
      dragLeave: '&dsDragLeave',
      dragEnd: '&dsDragEnd',
      dragDrop: '&dsDragDrop',
      allowDrag: '=dsDragEnabled'
    },
    link: function(scope, element) {
      if (scope.allowDrag) {
        element[0].draggable = true;
      }
      element.addClass('ds-drop-target');
      element[0].addEventListener('dragstart', function(e) {
        var handler = scope.dragStart();
        if (handler) {
          handler(e, scope.transferData);
        }
      });
      element[0].addEventListener('dragenter', function(e) {
        var handler = scope.dragEnter();
        if (handler) {
          handler(e, scope.transferData);
        }
      });
      element[0].addEventListener('dragover', function(e) {
        var handler = scope.dragOver();
        if (handler) {
          handler(e, scope.transferData);
        }
      });
      var dragLeaveHandler = function(e) {
        var handler = scope.dragLeave();
        if (handler) {
          handler(e, scope.transferData);
        }
      };
      element[0].addEventListener('dragleave', dragLeaveHandler);
      element[0].addEventListener('dragexit', dragLeaveHandler);
      element[0].addEventListener('dragend', function(e) {
        var handler = scope.dragEnd();
        if (handler) {
          handler(e, scope.transferData);
        }
      });
      element[0].addEventListener('drop', function(e) {
        var handler = scope.dragDrop();
        if (handler) {
          handler(e, scope.transferData);
        }
      });
    }
  };
});

mod.directive('dsInfiniteScroll', function() {
  return {
    restrict: 'A',
    scope: {
      scrollBottom: '&',
      scrollTop: '&',
      bottomHeight: '='
    },
    link: function(scope, element, attrs) {
      var el = element[0];
      el.addEventListener('scroll', function(e) {
        var pos = el.offsetHeight + el.scrollTop;
        if (pos >= el.scrollHeight - scope.bottomHeight) {
          scope.scrollBottom(el, pos);
        }
        if (pos <= el.offsetHeight) {
          if (scope.scrollTop) {
            scope.scrollTop(el, pos);
          }
        }
      });
    }
  };
});

mod.directive('dsUser', [
  'UserService',
  function(UserService) {
    return {
      restrict: 'EA',
      scope: {
        username: '=',
        format: '@'
      },
      link: function(scope, element) {
        var format = scope.format || 'name';
        UserService.get(scope.username).then(function(user) {
          switch (format) {
            case 'lname':
              element.text(user.last_name + ', ' + user.first_name + ';');
              break;
            case 'name':
              element.text(user.first_name + ' ' + user.last_name);
              break;
            case 'email':
              element.text(user.email);
              break;
            case 'name-email':
              element.text(user.first_name + ' ' + user.last_name + ' <' + user.email + '>');
              break;
            case 'name-username':
              element.text(user.first_name + ' ' + user.last_name + ' (' + user.username + ')');
              break;
            case 'name-username-email':
              element.text(user.first_name + ' ' + user.last_name + ' (' + user.username + ') <' + user.email + '>');
              break;
            default:
              element.text(user.username);
          }
        });
      }
    };
  }
]);



export default mod;
