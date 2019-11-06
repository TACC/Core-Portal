import { hot } from 'react-hot-loader/root';
import React from 'react';
import AppRouter from '../../routes';


const Workbench = () => {
  return (
    <div className="Workbench">
      <AppRouter />
    </div>
  );
}

export default hot(Workbench);
