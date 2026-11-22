import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { describe, expect, it, vi } from 'vitest';
import CollapsibleBlockquote from './CollapsibleBlockquote';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key, options) => options.defaultValue }) }));

describe('lectura de citas', () => {
    it('expande y contrae sin activar el mensaje contenedor', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const messageClick = vi.fn();
        try {
            act(() => {
                ReactDOM.render(React.createElement('div', { onClick: messageClick },
                    React.createElement(CollapsibleBlockquote, { initialCollapsed: true }, 'Texto citado')), host);
            });
            const button = host.querySelector('button');
            expect(button.getAttribute('aria-expanded')).toBe('false');
            expect(host.querySelector('.message-blockquote-content').contains(button)).toBe(false);
            act(() => { button.click(); });
            expect(button.getAttribute('aria-expanded')).toBe('true');
            act(() => { button.click(); });
            expect(button.getAttribute('aria-expanded')).toBe('false');
            expect(messageClick).not.toHaveBeenCalled();
        } finally {
            act(() => { ReactDOM.unmountComponentAtNode(host); });
            host.remove();
        }
    });
});
