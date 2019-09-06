import angular from "angular";
import './components';
import './service';

let mod = angular.module(
  'portal.notifications', 
  [ 
    'portal.notifications.components',
    'portal.notifications.service' 
  ]
);

export default mod;
