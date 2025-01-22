import React, { useCallback, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import PropTypes from 'prop-types';
import { Button } from '_common';
import styles from './TextCopyField.module.scss';

const TextCopyField = ({ value, placeholder, displayField }) => {
  const transitionDuration = 0.15; // second(s)
  const stateDuration = 1; // second(s)
  const stateTimeout = transitionDuration + stateDuration; // second(s)

  const [isCopied, setIsCopied] = useState(false);

  const onCopy = useCallback(() => {
    setIsCopied(true);

    const timeout = setTimeout(() => {
      setIsCopied(false);
      clearTimeout(timeout);
    }, stateTimeout * 1000);
  }, [isCopied, setIsCopied]);
  const isEmpty = !value || value.length === 0;
  const onChange = (event) => {
    // Swallow keyboard events on the Input control, but
    // still allow selecting the text. readOnly property of
    // Input is not adequate for this purpose because it
    // prevents text selection
    event.preventDefault();
  };

  const clipboardProps = {
    onClick: onCopy,
    disabled: isEmpty,
    type: 'secondary',
    size: 'medium',
    className: styles['copy-button'],
    iconNameBefore: isCopied ? 'approved-reverse' : 'link',
  };

  const fieldProps = {
    onChange: onChange,
    value: value,
    placeholder: placeholder,
  };

  return (
    <div className="input-group">
      {displayField === 'textarea' ? (
        <>
          <textarea
            {...fieldProps}
            className={`${styles.textarea}`}
            data-testid="textarea"
            readOnly
          />
          <div className="input-group-text ms-auto p-0 my-2 bg-transparent border-0">
            <CopyToClipboard text={value}>
              <Button {...clipboardProps}>Copy</Button>
            </CopyToClipboard>
          </div>
        </>
      ) : (
        <>
          <div className="input-group-prepend">
            <CopyToClipboard text={value}>
              <Button {...clipboardProps}>Copy</Button>
            </CopyToClipboard>
          </div>
          <input
            {...fieldProps}
            type="text"
            className={`form-control ${styles.input}`}
            data-testid="input"
            readOnly
          />
        </>
      )}
    </div>
  );
};

TextCopyField.propTypes = {
  value: PropTypes.string,
  placeholder: PropTypes.string,
  displayField: PropTypes.oneOf(['input', 'textarea']),
};

TextCopyField.defaultProps = {
  value: '',
  placeholder: '',
  displayField: 'input', //Default to input (original)
};

export default TextCopyField;
