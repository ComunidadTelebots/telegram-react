import React, { useEffect, useRef, useState } from 'react';
import { withTranslation } from 'react-i18next';
import IconButton from '@material-ui/core/IconButton';
import ZoomIn from '@material-ui/icons/ZoomIn';
import ZoomOut from '@material-ui/icons/ZoomOut';

const FIT = { scale: 1, x: 0, y: 0 };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function constrain(scale, x, y, stage, image) {
    const maxX = Math.max(0, (image.clientWidth * scale - stage.clientWidth) / 2);
    const maxY = Math.max(0, (image.clientHeight * scale - stage.clientHeight) / 2);
    return { scale, x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
}

export function ZoomablePhoto({ src, t, i18n, onNext, onPrevious }) {
    const stage = useRef(null);
    const image = useRef(null);
    const pointers = useRef(new Map());
    const gesture = useRef(null);
    const swipeStart = useRef(null);
    const [view, setView] = useState(FIT);
    const spanish = i18n.language?.startsWith('es');
    const label = (key, es, en) => t(key, { defaultValue: spanish ? es : en });

    useEffect(() => {
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(() => {
            if (!stage.current || !image.current) return;
            setView(v => v.scale === 1 ? v : constrain(v.scale, v.x, v.y, stage.current, image.current));
        });
        observer.observe(stage.current);
        observer.observe(image.current);
        return () => observer.disconnect();
    }, []);

    function zoom(requested, originX = 0, originY = 0) {
        const scale = clamp(requested, 1, 4);
        setView(v => {
            if (scale === 1) return FIT;
            const ratio = scale / v.scale;
            return constrain(scale, originX + (v.x - originX) * ratio, originY + (v.y - originY) * ratio,
                stage.current, image.current);
        });
    }

    function doubleClick(event) {
        const bounds = stage.current.getBoundingClientRect();
        zoom(view.scale === 1 ? 2 : 1, event.clientX - bounds.left - bounds.width / 2,
            event.clientY - bounds.top - bounds.height / 2);
    }

    function measurement() {
        const [first, second] = pointers.current.values();
        if (!first) return null;
        if (!second) return { x: first.x, y: first.y };
        return {
            x: (first.x + second.x) / 2,
            y: (first.y + second.y) / 2,
            distance: Math.hypot(second.x - first.x, second.y - first.y),
        };
    }

    function rebaseGesture() {
        const origin = measurement();
        gesture.current = origin ? { origin, view } : null;
    }

    function startPointer(event) {
        const active = pointers.current;
        const touch = event.pointerType === 'touch';
        if (!touch && (event.button !== 0 || !event.isPrimary || view.scale === 1)) return;
        if (active.size >= 2 || (active.size && (!touch || !active.values().next().value.touch))) return;
        swipeStart.current = touch && active.size === 0 && view.scale === 1
            ? { x: event.clientX, y: event.clientY } : null;
        active.set(event.pointerId, { x: event.clientX, y: event.clientY, touch });
        image.current.setPointerCapture(event.pointerId);
        rebaseGesture();
    }

    function move(event) {
        const point = pointers.current.get(event.pointerId);
        if (!point) return;
        point.x = event.clientX;
        point.y = event.clientY;
        const { origin, view: start } = gesture.current;
        const current = measurement();
        if (current.distance === undefined) {
            if (start.scale > 1) setView(constrain(start.scale, start.x + current.x - origin.x,
                start.y + current.y - origin.y, stage.current, image.current));
            return;
        }
        if (!origin.distance) {
            rebaseGesture();
            return;
        }
        const bounds = stage.current.getBoundingClientRect();
        const anchorX = origin.x - bounds.left - bounds.width / 2;
        const anchorY = origin.y - bounds.top - bounds.height / 2;
        const scale = clamp(start.scale * current.distance / origin.distance, 1, 4);
        const ratio = scale / start.scale;
        setView(scale === 1 ? FIT : constrain(scale,
            current.x - origin.x + anchorX + (start.x - anchorX) * ratio,
            current.y - origin.y + anchorY + (start.y - anchorY) * ratio,
            stage.current, image.current));
    }

    function endPointer(event) {
        if (!pointers.current.delete(event.pointerId)) return;
        const start = swipeStart.current;
        swipeStart.current = null;
        rebaseGesture();
        if (!start || event.type !== 'pointerup' || view.scale !== 1) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        const threshold = clamp(stage.current.clientWidth * 0.15, 40, 96);
        if (Math.abs(dx) < threshold || Math.abs(dx) < 1.5 * Math.abs(dy)) return;
        const navigate = dx < 0 ? onNext : onPrevious;
        if (navigate) navigate();
    }

    function keyDown(event) {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        const steps = { ArrowLeft: [48, 0], ArrowRight: [-48, 0], ArrowUp: [0, 48], ArrowDown: [0, -48] };
        if (event.key === '+' || event.key === '=') zoom(view.scale + 0.5);
        else if (event.key === '-') zoom(view.scale - 0.5);
        else if (event.key === '0') zoom(1);
        else if (steps[event.key] && view.scale > 1) {
            const [dx, dy] = steps[event.key];
            setView(constrain(view.scale, view.x + dx, view.y + dy, stage.current, image.current));
        } else return;
        event.preventDefault();
        event.stopPropagation();
        // React 16 delegates keys to document, alongside the gallery navigation listener.
        event.nativeEvent.stopImmediatePropagation();
    }

    return (
        <div className='viewer-photo-stage' ref={stage} onKeyDownCapture={keyDown}>
            <img ref={image} tabIndex={0} className='media-viewer-content-image' src={src}
                alt={label('Photo', 'Foto', 'Photo')} draggable={false}
                onClick={event => { event.stopPropagation(); image.current.focus(); }} onDoubleClick={doubleClick}
                onPointerDown={startPointer} onPointerMove={move} onPointerUp={endPointer}
                onPointerCancel={endPointer} onLostPointerCapture={endPointer}
                style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                    cursor: view.scale > 1 ? 'grab' : 'zoom-in', touchAction: 'none' }} />
            {src && <div className='viewer-photo-tools' role='group' aria-label={label('PhotoZoom', 'Zoom de foto', 'Photo zoom')}
                onClick={event => event.stopPropagation()}>
                <IconButton size='small' aria-label={label('MediaZoomOut', 'Reducir', 'Zoom out')}
                    disabled={view.scale === 1} onClick={() => zoom(view.scale - 0.5)}><ZoomOut /></IconButton>
                <button type='button' className='viewer-photo-fit' aria-label={label('PhotoFit', 'Ajustar foto', 'Fit photo')}
                    onClick={() => zoom(1)}>{Math.round(view.scale * 100)}%</button>
                <IconButton size='small' aria-label={label('MediaZoomIn', 'Ampliar', 'Zoom in')}
                    disabled={view.scale === 4} onClick={() => zoom(view.scale + 0.5)}><ZoomIn /></IconButton>
            </div>}
        </div>
    );
}

export default withTranslation()(ZoomablePhoto);
