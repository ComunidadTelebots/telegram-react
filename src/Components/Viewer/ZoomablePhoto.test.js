import React from 'react';
import ReactDOM from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';
import { beforeEach, afterEach, expect, it } from 'vitest';
import { ZoomablePhoto } from './ZoomablePhoto';

let host;
const render = key => {
    act(() => {
        ReactDOM.render(<ZoomablePhoto key={key} src='photo.jpg' i18n={{ language: 'es' }}
            t={(_, options) => options.defaultValue} />, host);
    });
};
const button = name => host.querySelector('button[aria-label="' + name + '"]');
const click = node => act(() => { Simulate.click(node); });

beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    render('photo-a');
    for (const el of [host.querySelector('.viewer-photo-stage'), host.querySelector('img')]) {
        Object.defineProperty(el, 'clientWidth', { value: 200 });
        Object.defineProperty(el, 'clientHeight', { value: 100 });
    }
});
afterEach(() => {
    act(() => { ReactDOM.unmountComponentAtNode(host); });
    host.remove();
});

it('zooms in half steps, stops at 4x, and fits the image', () => {
    expect(button('Reducir').disabled).toBe(true);
    click(button('Ampliar'));
    expect(button('Ajustar foto').textContent).toBe('150%');
    for (let i = 0; i < 5; i++) click(button('Ampliar'));
    expect(button('Ampliar').disabled).toBe(true);
    click(button('Reducir'));
    expect(button('Ajustar foto').textContent).toBe('350%');
    click(button('Ajustar foto'));
    expect(button('Ajustar foto').textContent).toBe('100%');
});

it('keeps drag offsets within the enlarged photo and resets on a new item', () => {
    click(button('Ampliar'));
    const image = host.querySelector('img');
    image.setPointerCapture = () => {};
    act(() => { Simulate.pointerDown(image, { button: 0, isPrimary: true, pointerId: 1, clientX: 100, clientY: 50 }); });
    act(() => { Simulate.pointerMove(image, { pointerId: 1, clientX: 900, clientY: 500 }); });
    expect(image.style.transform).toBe('translate(50px, 25px) scale(1.5)');
    render('photo-b');
    expect(button('Ajustar foto').textContent).toBe('100%');
});

it('toggles double-click zoom at the pointer', () => {
    const image = host.querySelector('img');
    host.querySelector('.viewer-photo-stage').getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 });
    act(() => { Simulate.doubleClick(image, { clientX: 150, clientY: 70 }); });
    expect(image.style.transform).toBe('translate(-50px, -20px) scale(2)');
    act(() => { Simulate.doubleClick(image, { clientX: 150, clientY: 70 }); });
    expect(button('Ajustar foto').textContent).toBe('100%');
});
