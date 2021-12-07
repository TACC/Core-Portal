import React from 'react';
import { Button } from '_common';


const UIPatternsButton = () => {

  const clickButton = (buttonType) => {
      alert(buttonType + " Button Clicked")
  }
    
  return (
    <div>
      <p>Buttons with Icons</p>
      <Button iconBeforeName="icon-applications" className="m-1" type="info" onClick={() => clickButton('Info')}>Info Button with icon before text</Button>
      <Button iconAfterName="icon-folder" className="m-1" type="success" onClick={() => clickButton('Success')}>Warning Button with icon after text</Button>      
      <Button iconBeforeName="icon-applications" iconAfterName="icon-folder" className="m-1" type="warning" onClick={() => clickButton('Warning')}>Warning Button with icons before and after text</Button>   
      <hr />

    </div>
  );
};

export default UIPatternsButton;
