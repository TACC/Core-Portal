import React from 'react';
import { Button } from '_common';


const UIPatternsButton = () => {

  const clickButton = (buttonType) => {
      alert(buttonType + " Button Clicked")
  }
    
  return (
    <div>
      <p>Buttons using the predefined Bootstrap button styles</p>
      <Button className="m-1" type="primary" onClick={() => clickButton('Primary')}>Primary Button</Button>
      <Button className="m-1" type="secondary" onClick={() => clickButton('Secondary')}>Secondary Button</Button>
      <Button className="m-1" type="success" onClick={() => clickButton('Success')}>Success Button</Button>
      <Button className="m-1" type="info" onClick={() => clickButton('Info')}>Info Button</Button>
      <Button className="m-1" type="warning" onClick={() => clickButton('Warning')}>Warning Button</Button>
      <Button className="m-1" type="danger" onClick={() => clickButton('Deeper')}>Danger Button</Button>
      <Button className="m-1"type="link" onClick={() => clickButton('Link')}>Link Button</Button>
      <hr />
      <p>Buttons using the predefined Bootstrap button styles</p>
      <Button className="m-1" color="red" onClick={() => clickButton('Primary')}>Primary Button</Button>
      <Button className="m-1" type="secondary" onClick={() => clickButton('Secondary')}>Secondary Button</Button>
      <Button className="m-1" type="success" onClick={() => clickButton('Success')}>Success Button</Button>
      <Button className="m-1" type="info" onClick={() => clickButton('Info')}>Info Button</Button>
      <Button className="m-1" type="warning" onClick={() => clickButton('Warning')}>Warning Button</Button>
      <Button className="m-1" type="danger" onClick={() => clickButton('Deeper')}>Danger Button</Button>
      <Button className="m-1"type="link" onClick={() => clickButton('Link')}>Link Button</Button>      
      
    </div>
  );
};

export default UIPatternsButton;
