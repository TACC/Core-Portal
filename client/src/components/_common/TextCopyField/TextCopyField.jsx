import React, { useCallback, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import PropTypes from 'prop-types';
import { Button } from '_common';
import styles from './TextCopyField.module.scss';

const TextCopyField = ({ value, placeholder, renderType }) => {
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

  return (
    <div className="input-group">
      {renderType === 'textarea' ? (
        <>
          <textarea
            onChange={onChange}
            value={value}
            className={`${styles.textarea}`}
            placeholder={placeholder}
            data-testid="textarea"
            readOnly
          />
          <div className="text-right mt-3">
            <CopyToClipboard text={value}>
              <Button
                onClick={onCopy}
                disabled={isEmpty}
                type="secondary"
                size="medium"
                iconNameBefore={isCopied ? 'approved-reverse' : 'link'}
              >
                Copy
              </Button>
            </CopyToClipboard>
          </div>
        </>
      ) : (
        <>
          <div className="input-group-prepend">
            <CopyToClipboard text={value}>
              <Button
                className={styles['copy-button']}
                // RFE: Avoid manual JS ↔ CSS sync of transition duration by using:
                //      - `data-attribute` and `attr()` (pending browser support)
                //      - PostCSS and JSON variables (pending greater need for this)
                onClick={onCopy}
                disabled={isEmpty}
                type="secondary"
                size="medium"
                iconNameBefore={isCopied ? 'approved-reverse' : 'link'}
              >
                Copy
              </Button>
            </CopyToClipboard>
          </div>
          <input
            type="text"
            onChange={onChange}
            value={value}
            className={`form-control ${styles.input}`}
            placeholder={placeholder}
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
  renderType: PropTypes.oneOf(['input', 'textarea']),
};

TextCopyField.defaultProps = {
  value: '',
  placeholder: '',
  renderType: 'input', //Default to input (original)
};

export default TextCopyField;
