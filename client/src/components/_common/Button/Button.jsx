import React from 'react';
import PropTypes from 'prop-types';
import { Button as BootstrapButton } from 'reactstrap';
import Icon from '../Icon';

import '../../../styles/components/c-button.css';

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

const Button = ({text, iconNameBefore, iconNameAfter, type, size, ...props}) => {
    let buttonTypeClass = 'c-button--';
    if (type === 'link') {
            buttonTypeClass += 'as-link';
    } else if (type === 'primary' || type === 'secondary') {
        buttonTypeClass += type;
    } else if (type === '') {
        buttonTypeClass = type;
    }
    let buttonSizeClass = 'c-button--';
    if (size==='small') {
        buttonSizeClass += 'size-small';
    } else {
        buttonSizeClass += `width-${size}`;
    }
    return (
        <BootstrapButton {...props} className={`c-button ${ buttonTypeClass } ${ buttonSizeClass }`}>
            <Icon name={ iconNameBefore } className={ iconNameBefore ? 'c-button__icon--before' : '' }></Icon>
            <span className='button-text'>
                { text }
            </span>
            <Icon name={ iconNameAfter } className={ iconNameAfter ? 'c-button__icon--after' : '' }></Icon>
        </BootstrapButton>
    )
};
Button.propTypes = {
    text: PropTypes.string.isRequired,
    iconNameBefore: PropTypes.string,
    iconNameAfter: PropTypes.string,
    type: PropTypes.oneOf(TYPES),
    size: PropTypes.oneOf(SIZES)
};
Button.defaultTypes = {
    iconNameBefore: '',
    iconNameAfter: '',
    type: '',
    size: 'medium'
};

export default Button;