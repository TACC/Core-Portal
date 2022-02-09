import { Button } from '_common';

function UIPatternsButton() {
    return (
        <dl>
            <dt>Default Button</dt>
            <dd>
                <Button children='Button'></Button>
            </dd>
            <dt>Primary Button</dt>
            <dd>
                <Button children='Button' type='primary'></Button>
                <Button children='Disabled' type='primary' disabled={true}></Button>
            </dd>
            <dt>Secondary Button</dt>
            <dd>
                <Button children='Button' type='secondary'></Button>
                <Button children='Disabled' type='secondary' disabled={true}></Button>
            </dd>
            <dt>Button Sizes</dt>
            <dd>
                <Button children='s' size='small'></Button>
                <Button children='short' size='short'></Button>
                <Button children='medium' size='medium'></Button>
                <Button children='large' size='large'></Button>
            </dd>
            <dt>Button with Icon</dt>
            <dd>
                <Button children='Button' iconNameBefore='trash'></Button>
                <Button children='Button' iconNameAfter='trash'></Button>
            </dd>
            <dt>Button as Link</dt>
            <dd>
                <Button children='Link' type='link'></Button>
            </dd>
        </dl>
    );
}

export default UIPatternsButton;
