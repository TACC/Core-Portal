import 'react-hot-loader';
import React from 'react';
import ReactDOM from 'react-dom';
import Workbench from './components/workbench';
import './index.css';
import * as serviceWorker from './serviceWorker';
import 'bootstrap'
import './fontawesome';


ReactDOM.render(<Workbench />, document.getElementById('react-root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
