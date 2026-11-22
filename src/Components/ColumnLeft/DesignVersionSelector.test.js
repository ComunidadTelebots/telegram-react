import React from 'react';
import ReactDOM from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';
import { setDesign, usesEraFeatures } from '../../Design';
import DesignVersionSelector from './DesignVersionSelector';
import { newestDesignVersionsFirst } from '../../Utils/DesignVersionOrder';

describe('DesignVersionSelector ordering', () => {
    it('shows the newest version first without mutating the registry', () => {
        const versions = [{ value: '2013' }, { value: '2016' }, { value: '2026' }];

        expect(newestDesignVersionsFirst(versions).map(item => item.value)).toEqual(['2026', '2016', '2013']);
        expect(versions.map(item => item.value)).toEqual(['2013', '2016', '2026']);
    });
});

describe('DesignVersionSelector feature mode', () => {
    let host;

    beforeEach(() => {
        setDesign('android-v12');
        host = document.createElement('div');
        document.body.appendChild(host);
        act(() => { ReactDOM.render(<DesignVersionSelector />, host); });
        act(() => { Simulate.click(host.querySelector('.dv-trigger')); });
    });

    afterEach(() => {
        act(() => { ReactDOM.unmountComponentAtNode(host); });
        host.remove();
        localStorage.clear();
        document.body.className = '';
    });

    it('persists either feature mode without changing the timeline', () => {
        for (const [value, enabled] of [['era', true], ['all', false]]) {
            const input = host.querySelector('input[value="' + value + '"]');
            act(() => { input.click(); });
            expect(input.checked).toBe(true);
            expect(usesEraFeatures()).toBe(enabled);
            expect(localStorage.getItem('tg_design')).toBe('android-v12');
        }
    });

    it('returns keyboard focus to the trigger when Escape closes the menu', () => {
        const radio = host.querySelector('input[value="all"]');
        radio.focus();
        act(() => { Simulate.keyDown(radio, { key: 'Escape' }); });
        expect(host.querySelector('.dv-menu')).toBeNull();
        expect(document.activeElement).toBe(host.querySelector('.dv-trigger'));
        expect(document.activeElement.getAttribute('aria-expanded')).toBe('false');
    });
});
