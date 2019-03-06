import angular from 'angular';
import agaveFilePicker from './agave-file-picker';
import focusout from './focusout';

let mod = angular.module('portal.workspace.directives', []);

mod.directive('agaveFilePicker', agaveFilePicker);
mod.directive('focusout', focusout);
