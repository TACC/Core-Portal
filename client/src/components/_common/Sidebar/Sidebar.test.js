import React from 'react';
import { queryByTestId, render } from '@testing-library/react';
import Sidebar from './Sidebar';
import { BrowserRouter } from 'react-router-dom';

describe('Sidebar', () => {
    it('does not render sidebar where one item has no text', () => {
        const sidebarItems = [
            {to: 'history', iconName: 'file', children: 'History'},
            {to: 'applications', iconName: 'alert'},
            {to: 'ui-patterns', iconName: 'trash', children: 'UI Patterns'}
        ];
        const { queryByTestId } = render(
            <BrowserRouter>
                <Sidebar data-testid="no sidebar here" sidebarItems={sidebarItems} />
            </BrowserRouter>
        )
        const el = queryByTestId('no sidebar here');
        expect(el).toBeNull;
    });
})
