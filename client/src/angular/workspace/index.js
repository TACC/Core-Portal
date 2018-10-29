import asfAgaveFilePickerTemplate from './templates/asf-agave-file-picker.html';
import {mod as controllers} from './controllers';
import {mod as directives} from './directives';
import {mod as services} from './services';
import angular from 'angular';

function config($interpolateProvider, $httpProvider, $urlRouterProvider, $stateProvider, $translateProvider) {
  'ngInject';

  $translateProvider.translations('en', {
      error_system_monitor: "The execution system for this app is currently unavailable. Your job submission may fail.",
      error_app_run: "Could not find appId provided",
      error_app_disabled: "The app you're trying to run is currently disabled. Please enable the app and try again.",
      error_rename_file: "There was an error renaming your file.",
      error_move_file: "There was an error moving your file.",
      error_copy_file: "There was an error copying your file.",
      error_download_file: "There was an error downloading your file.",
      error_trash_file: "There was an error when sending your file to the trash.",
      success_rename_file: "File/folder has been renamed.",
      success_move_file: "File/folder has been moved.",
      success_copy_file: "File/folder has been copied.",
      success_trash_file: "File/folder has been moved to trash.",
      error_mkdir: "There was an error creating the file.",
      success_mkdir: "Directory created."
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
    $templateCache.put('/asf-agave-file-picker.html', asfAgaveFilePickerTemplate);
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
        '/asf-agave-file-picker.html',
        defaults
      );
    }
  ]);

export default mod;
