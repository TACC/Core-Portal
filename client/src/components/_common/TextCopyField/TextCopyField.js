import React, { useCallback, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import Icon from '../Icon';
import './TextCopyField.module.scss';

const TextCopyFieldButton = ({ isEmpty }) => {
  // Must equal CSS `--transition-duration` value
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

  return (
    <Button
      styleName={`copy-button ${isCopied ? 'is-copied' : ''}`}
      onClick={onCopy}
      disabled={isEmpty}
      type="button"
    >
      <Icon
        name={isCopied ? 'approved-reverse' : 'link'}
        styleName="button__icon"
      />
      <span styleName="button__text">Copy</span>
    </Button>
  );
};

TextCopyFieldButton.propTypes = {
  isEmpty: PropTypes.bool.isRequired
};

const TextCopyField = ({ value, placeholder }) => {
  const isEmpty = !value || value.length === 0;
  const onChange = event => {
    // Swallow keyboard events on the Input control, but
    // still allow selecting the text. readOnly property of
    // Input is not adequate for this purpose because it
    // prevents text selection
    event.preventDefault();
  };

  return (
    <div className="input-group">
      <div className="input-group-prepend">
        <CopyToClipboard text={value}>
          <TextCopyFieldButton isEmpty={isEmpty} />
        </CopyToClipboard>
      </div>
      <input
        type="text"
        onChange={onChange}
        value={value}
        styleName="input"
        className="form-control"
        placeholder={placeholder}
        data-testid="input"
        readOnly
      />
    </div>
  );
};

TextCopyField.propTypes = {
  value: PropTypes.string,
  placeholder: PropTypes.string
};

TextCopyField.defaultProps = {
  value: '',
  placeholder: ''
};

export default TextCopyField;
