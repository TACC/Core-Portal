
import {mod as controllers} from './controllers';
import {mod as directives} from './directives';
import {mod as services} from './services';
import angular from 'angular';

function config($interpolateProvider, $httpProvider, $urlRouterProvider, $stateProvider, $translateProvider) {
  'ngInject';

  $translateProvider.translations('en', {
      error_system_monitor: "The execution system for this app is currently unavailable. Your job submission may fail.",
      error_app_run: "Could not find appId provided",
      error_app_disabled: "The app you're trying to run is currently disabled. Please enable the app and try again",
      apps_metadata_name: "portal_apps",
      apps_metadata_list_name: "portal_apps_list"
  });
  $translateProvider.preferredLanguage('en');
}


let mod = angular.module('portal.workspace', [
  'portal.workspace.controllers',
  'portal.workspace.services',
  'portal.workspace.directives'
]).config(config)
.run(function(editableOptions) {
  editableOptions.theme = 'bs3';
});

angular.module('schemaForm')
  .run(['$templateCache', '$http', function ($templateCache, $http) {
    $http.get('/static/src/angular/workspace/templates/asf-agave-file-picker.html').then(function (response) {
      $templateCache.put('/static/src/angular/workspace/templates/asf-agave-file-picker.html', response.data);
    });
  }])
  .config(
  ['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider', 'sfBuilderProvider',
    function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider, sfBuilderProvider) {

      var filePicker = function(name, schema, options) {
        if (schema.type === 'string' && schema.format === 'agaveFile') {
          var f = schemaFormProvider.stdFormObj(name, schema, options);
          f.key  = options.path;
          f.type = 'agaveFilePicker';
          options.lookup[sfPathProvider.stringify(options.path)] = f;
          return f;
        }
        return null;
      };

      schemaFormProvider.defaults.string.unshift(filePicker);

      //Add to the bootstrap directive
      let sfField = sfBuilderProvider.builders.sfField;
      let ngModel = sfBuilderProvider.builders.ngModel;
      let defaults = [sfField, ngModel];

      schemaFormDecoratorsProvider.defineAddOn(
        'bootstrapDecorator',
        'agaveFilePicker',
        '/static/src/angular/workspace/templates/asf-agave-file-picker.html',
        defaults
      );
      // schemaFormDecoratorsProvider.createDirective(
      //   'agaveFilePicker',
      //   '/static/src/angular/workspace/templates/asf-agave-file-picker.html'
      // );
    }
  ]);

export default mod;
