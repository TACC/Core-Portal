import { hot } from 'react-hot-loader/root';
import React from 'react';
import AppRouter from '../../routes';


const App = () => {
  return (
    <div className="App">
      <AppRouter />
    </div>
  );
}

export default hot(App);
