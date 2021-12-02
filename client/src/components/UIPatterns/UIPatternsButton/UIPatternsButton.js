import React from 'react';
import { Button } from '_common';


const UIPatternsButton = () => {

  const clickButton = (buttonType) => {
      alert(buttonType + " Button Clicked")
  }
    
  return (
    <div>
      <p>Buttons using the predefined Bootstrap button styles</p>
      <div className="btn-group">
        {/* <Button iconBeforeName="icon-user" iconAfterName="icon-user" color="primary" onClick={() => clickButton('Primary')}>Primary Button</Button> */}
        <Button className="m-1" type="primary" onClick={() => clickButton('Primary')}>Primary Button</Button>
        <Button className="m-1" type="secondary" onClick={() => clickButton('Secondary')}>Secondary Button</Button>
        <Button className="m-1" type="success" onClick={() => clickButton('Success')}>Success Button</Button>
        <Button className="m-1" type="info" onClick={() => clickButton('Info')}>Info Button</Button>
        <Button className="m-1" type="warning" onClick={() => clickButton('Warning')}>Warning Button</Button>
        <Button className="m-1" type="danger" onClick={() => clickButton('Danger')}>Danger Button</Button>
        <Button iconBeforeName="icon-user" className="m-1"type="link" onClick={() => clickButton('Link')}>Link Button</Button>
      </div>
      <hr />
      <p>Buttons with Icons</p>
      <Button iconBeforeName="icon-applications" className="m-1" type="info" onClick={() => clickButton('Info')}>Info Button with icon before text</Button>
      <Button iconAfterName="icon-folder" className="m-1" type="success" onClick={() => clickButton('Success')}>Warning Button with icon after text</Button>      
      <Button iconBeforeName="icon-applications" iconAfterName="icon-folder" className="m-1" type="warning" onClick={() => clickButton('Warning')}>Warning Button with icons before and after text</Button>   
      <hr />
      <p>Disabled Button</p>  
      <Button disabled className="m-1" type="info" onClick={() => clickButton('Disabled Info')}>Disabled Info Button</Button>
    </div>
  );
};

export default UIPatternsButton;
