import angular from 'angular';
import publicDataViewComponent from './public-data-view/public-data-view.component';

const mod = angular.module('portal.public_data.components', []);

mod.component('publicDataViewComponent', publicDataViewComponent);