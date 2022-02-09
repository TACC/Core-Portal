import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../Icon';

import styles from './Button.module.css';

export const TYPES = [
    '',
    'primary',
    'secondary',
    'success',
    'info',
    'warning',
    'danger',
    'link'
];

export const SIZES = [
    'short',
    'medium',
    'large',
    'small'
]

const Button = ({children, iconNameBefore, iconNameAfter, type, size, disabled, onClick}) => {
    function onclick(e) {
        if (disabled) {
            e.preventDefault();
            return;
        }
        if (onClick) {
            return onclick(e);
        }
    }

    let buttonTypeClass;
    if (type === 'link') {
            buttonTypeClass = styles['c-button--as-link'];
    } else if (type === 'primary' || type === 'secondary') {
        buttonTypeClass = styles[`c-button--${type}`];
    } else if (type === '') {
        buttonTypeClass = type;
    }
    
    let buttonSizeClass;
    if (size === 'small') {
        buttonSizeClass = styles['c-button--size-small'];
    } else {
        buttonSizeClass = styles[`c-button--width-${size}`];
    }

    return (
        <button className={`c-button ${ buttonTypeClass } ${ buttonSizeClass }`} disabled={disabled} type='button' onClick={onclick}>
            <Icon name={ iconNameBefore } className={ iconNameBefore ? styles['c-button__icon--before'] : '' }></Icon>
            <span className='c-button__text'>
                { children }
            </span>
            <Icon name={ iconNameAfter } className={ iconNameAfter ? styles['c-button__icon--after'] : '' }></Icon>
        </button>
    )
};
Button.propTypes = {
    children: PropTypes.string.isRequired,
    iconNameBefore: PropTypes.string,
    iconNameAfter: PropTypes.string,
    type: PropTypes.oneOf(TYPES),
    size: PropTypes.oneOf(SIZES),
    disabled: PropTypes.bool,
    onClick: PropTypes.func
};
Button.defaultProps = {
    iconNameBefore: '',
    iconNameAfter: '',
    type: '',
    size: 'medium',
    disabled: false,
    onClick: null
};

export default Button;
