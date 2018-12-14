import fpTemplate from '../templates/agave-file-picker.html';

function agaveFilePicker() {
    return {
      restrict: 'EA',
      require: 'ngModel',
      replace: true,
      template: fpTemplate,
      link: function($scope, $element, attrs, $ngModel) {
        var formKey = $scope.form.key.join('.');
        $scope.data = {
          input: null
        };
        $scope.$watch( ()=> {return $ngModel;}, (value)=> {
          $scope.data.input = value.$viewValue;
        });
        /*
        formKey requires an index when it is an array. $scope.$parent.$index will be a value 0 or greater
        if it's an array, so append it to the formKey
        */

        if (formKey[formKey.length - 1] == '.' && $scope.$parent.$index >= 0 ) {
          formKey += $scope.$parent.$index;
        }

        $scope.requesting = false;



        $scope.wantFile = function wantFile($event) {
          $event.preventDefault();
          $element.parent().addClass('wants');
          $scope.$emit('wants-file', {
            requestKey: formKey,
            title: $scope.form.title || formKey,
            description: $scope.form.description || ''
          });
          $scope.requesting = true;
        };

        function stopWant() {
          $element.parent().removeClass('wants');
          $scope.$emit('cancel-wants-file', {requestKey: formKey});
          $scope.requesting = false;
        }

        $scope.stopWant = function($event) {
          $event.preventDefault();
          stopWant();
        };

        $scope.$on('provides-file', function($event, args) {
          var requestKey = args.requestKey || '';
          var file = args.file || {};
          var agavePath = 'agave://' + file.system + file.path;
          if (formKey === requestKey) {
            $scope.data.input = agavePath;
            $ngModel.$setViewValue(agavePath);
            stopWant();
          }
        });

        $element.find('input').on('change', function() {
          $ngModel.$setViewValue($scope.data.input);
        });
      }
    };
  }

  export default agaveFilePicker;
