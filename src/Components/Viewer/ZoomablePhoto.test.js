import React from 'react';
import ReactDOM from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';
import { beforeEach, afterEach, expect, it } from 'vitest';
import { ZoomablePhoto } from './ZoomablePhoto';

let host;
const render = (key, navigation = {}) => {
    act(() => {
        ReactDOM.render(<ZoomablePhoto key={key} {...navigation} src='photo.jpg' i18n={{ language: 'es' }}
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

function touch(kind, id, x, y) {
    const image = host.querySelector('img');
    act(() => { Simulate[kind](image, {
        pointerType: 'touch', pointerId: id, isPrimary: id === 1, button: 0, clientX: x, clientY: y,
    }); });
}

it('pinches around the moving midpoint and continues panning with the remaining finger', () => {
    const image = host.querySelector('img');
    image.setPointerCapture = () => {};
    host.querySelector('.viewer-photo-stage').getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 });

    touch('pointerDown', 1, 60, 50);
    touch('pointerDown', 2, 100, 50);
    touch('pointerMove', 1, 20, 50);
    expect(image.style.transform).toBe('translate(0px, 0px) scale(2)');
    touch('pointerUp', 1, 20, 50);
    touch('lostPointerCapture', 1, 20, 50);
    touch('pointerMove', 2, 120, 60);
    expect(image.style.transform).toBe('translate(20px, 10px) scale(2)');
});

it('bounds pinch zoom and cleans up cancelled touches', () => {
    const image = host.querySelector('img');
    image.setPointerCapture = () => {};
    touch('pointerDown', 1, 50, 50);
    touch('pointerDown', 2, 70, 50);
    touch('pointerMove', 2, 170, 50);
    expect(button('Ajustar foto').textContent).toBe('400%');
    touch('pointerCancel', 2, 170, 50);
    touch('pointerCancel', 1, 50, 50);
    touch('pointerMove', 2, 60, 50);
    expect(button('Ajustar foto').textContent).toBe('400%');
    touch('pointerDown', 1, 10, 50);
    touch('pointerDown', 2, 110, 50);
    touch('pointerMove', 2, 20, 50);
    expect(image.style.transform).toBe('translate(0px, 0px) scale(1)');
});

it('pages through photos on horizontal swipes and ignores taps, vertical gestures and cancellations', () => {
    const history = [];
    render('photo-a', { onNext: () => history.push('next'), onPrevious: () => history.push('previous') });
    host.querySelector('img').setPointerCapture = () => {};
    function swipe(dx, dy, end = 'pointerUp') {
        touch('pointerDown', 1, 100, 50);
        touch('pointerMove', 1, 100 + dx, 50 + dy);
        touch(end, 1, 100 + dx, 50 + dy);
    }
    swipe(-80, 2);
    swipe(70, -2);
    swipe(10, 0);
    swipe(-60, 80);
    swipe(-80, 2, 'pointerCancel');
    expect(history.join(',')).toBe('next,previous');
    click(button('Ampliar'));
    swipe(-90, 0);
    expect(history.join(',')).toBe('next,previous');
});

it('keeps the remaining finger of a pinch from paging even after returning to fit', () => {
    let pages = 0;
    render('photo-a', { onNext: () => { pages++; } });
    host.querySelector('img').setPointerCapture = () => {};
    touch('pointerDown', 1, 100, 50);
    touch('pointerDown', 2, 120, 50);
    touch('pointerMove', 2, 110, 50);
    touch('pointerUp', 2, 110, 50);
    touch('pointerUp', 1, 10, 50);
    expect(pages).toBe(0);
});
