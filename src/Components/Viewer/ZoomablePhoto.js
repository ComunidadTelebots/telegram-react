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

export function ZoomablePhoto({ src, t, i18n }) {
    const stage = useRef(null);
    const image = useRef(null);
    const drag = useRef(null);
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

    function startDrag(event) {
        if (view.scale === 1 || event.button !== 0 || !event.isPrimary) return;
        image.current.setPointerCapture(event.pointerId);
        drag.current = { id: event.pointerId, x: event.clientX - view.x, y: event.clientY - view.y };
    }

    function move(event) {
        const origin = drag.current;
        if (!origin || origin.id !== event.pointerId) return;
        setView(constrain(view.scale, event.clientX - origin.x, event.clientY - origin.y, stage.current, image.current));
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
                onPointerDown={startDrag} onPointerMove={move} onLostPointerCapture={() => { drag.current = null; }}
                style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                    cursor: view.scale > 1 ? 'grab' : 'zoom-in', touchAction: view.scale > 1 ? 'none' : 'manipulation' }} />
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
