import angular from 'angular';

import mocks from 'angular-mocks';
import * as main from './src/index';

let context = require.context('./src', true, /\.spec\.js/);

context.keys().forEach(context);
