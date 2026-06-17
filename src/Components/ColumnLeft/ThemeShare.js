import React, { Component } from 'react';
import { getDesign, getPalette } from '../../Design';
import './ThemeShare.css';

const EDITOR_KEY = 'tg_design_editor';

function encodeTheme(design, palette, overrides) {
    const data = { d: design, p: palette || '' };
    const filtered = Object.fromEntries(Object.entries(overrides).filter(([, v]) => v));
    if (Object.keys(filtered).length > 0) data.o = filtered;
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}

function decodeTheme(hash) {
    try {
        return JSON.parse(decodeURIComponent(escape(atob(hash))));
    } catch {
        return null;
    }
}

export function applyThemeFromUrl() {
    const match = window.location.hash.match(/[#&]tgtheme=([A-Za-z0-9+/=]+)/);
    if (!match) return;
    const data = decodeTheme(match[1]);
    if (!data) return;
    const { d, p, o } = data;
    if (d) {
        import('../../Design').then(({ setDesign }) => setDesign(d));
    }
    if (p) {
        import('../../Design').then(({ setPalette }) => setPalette(p));
    }
    if (o) {
        const root = document.documentElement;
        Object.entries(o).forEach(([k, v]) => {
            if (v) root.style.setProperty(k, k === '--text-body' ? `${v}px` : v);
        });
        localStorage.setItem(EDITOR_KEY, JSON.stringify(o));
    }
}

class ThemeShare extends Component {
    constructor(props) {
        super(props);
        this.state = { copied: false };
    }

    buildLink = () => {
        const design = getDesign();
        const palette = getPalette();
        let overrides = {};
        try {
            overrides = JSON.parse(localStorage.getItem(EDITOR_KEY) || '{}');
        } catch {}
        const encoded = encodeTheme(design, palette, overrides);
        const url = `${window.location.origin}${window.location.pathname}#tgtheme=${encoded}`;
        return url;
    };

    handleCopy = () => {
        const link = this.buildLink();
        navigator.clipboard.writeText(link).then(() => {
            this.setState({ copied: true });
            setTimeout(() => this.setState({ copied: false }), 2000);
        });
    };

    render() {
        const { copied } = this.state;
        return (
            <div className='theme-share'>
                <button className='theme-share-btn' onClick={this.handleCopy}>
                    {copied ? '¡Copiado!' : 'Copiar enlace del tema'}
                </button>
                <p className='theme-share-hint'>
                    El enlace incluye diseño, paleta y overrides actuales. Al abrirlo se aplican automáticamente.
                </p>
            </div>
        );
    }
}

export default ThemeShare;
