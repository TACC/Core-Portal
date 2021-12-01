import React from 'react';
import { Button } from '_common';


const UIPatternsButton = () => {

  const clickButton = (buttonType) => {
      alert(buttonType + " Button Clicked")
  }
    
  return (
    <div>
      <p>Buttons using the predefined Bootstrap button styles</p>
      <Button iconBeforeName="alert" className="m-1" iconBeforeName="\e957" type="primary" onClick={() => clickButton('Primary')}>Primary Button</Button>
      <Button iconBeforeName="nav-left" className="m-1" type="secondary" onClick={() => clickButton('Secondary')}>Secondary Button</Button>
      <Button iconBeforeName="nav-left" className="m-1" type="success" onClick={() => clickButton('Success')}>Success Button</Button>
      <Button iconBeforeName="nav-left" className="m-1" type="info" onClick={() => clickButton('Info')}>Info Button</Button>
      <Button iconBeforeName="nav-left" className="m-1" type="warning" onClick={() => clickButton('Warning')}>Warning Button</Button>
      <Button iconBeforeName="nav-left" className="m-1" type="danger" onClick={() => clickButton('Deeper')}>Danger Button</Button>
      <Button iconBeforeName="nav-left" className="m-1"type="link" onClick={() => clickButton('Link')}>Link Button</Button>
      <hr />
      <p>Buttons using the predefined Bootstrap button styles</p>
      <Button iconBeforeName="nav-left" className="m-1" size="sm" color="primary" outline onClick={() => clickButton('Primary')}>Primary Button</Button>
      <Button iconBeforeName="nav-left" className="m-1" color="secondary" onClick={() => clickButton('Secondary')}>Secondary Button</Button>
      <Button className="m-1" color="success" onClick={() => clickButton('Success')}>Success Button</Button>
      <Button className="m-1" color="info" onClick={() => clickButton('Info')}>Info Button</Button>
      <Button className="m-1" color="warning" onClick={() => clickButton('Warning')}>Warning Button</Button>
      <Button className="m-1" color="danger" onClick={() => clickButton('Deeper')}>Danger Button</Button>
      <Button className="m-1"color="link" onClick={() => clickButton('Link')}>Link Button</Button>      
      
    </div>
  );
};

export default UIPatternsButton;
