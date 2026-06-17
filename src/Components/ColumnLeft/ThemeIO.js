import React, { Component, createRef } from 'react';
import { getDesign, getPalette } from '../../Design';
import './ThemeIO.css';

const EDITOR_KEY = 'tg_design_editor';

function buildCss(design, palette, overrides) {
    const lines = [
        `/* Telegram React — tema exportado */`,
        `/* Diseño: ${design} | Paleta: ${palette || 'ninguna'} */`,
        `:root {`,
    ];
    Object.entries(overrides).forEach(([k, v]) => {
        if (v) lines.push(`    ${k}: ${k === '--text-body' ? `${v}px` : v};`);
    });
    lines.push(`}`);
    if (design) lines.push(`\n/* body.design-${design} { … } — aplica este diseño en Design.js */`);
    if (palette) lines.push(`/* body.palette-${palette} { … } — aplica esta paleta en palettes.css */`);
    return lines.join('\n');
}

function parseCssOverrides(cssText) {
    const overrides = {};
    const rootBlock = cssText.match(/:root\s*\{([^}]*)\}/s);
    if (!rootBlock) return overrides;
    const propRegex = /(--[\w-]+)\s*:\s*([^;]+);/g;
    let m;
    while ((m = propRegex.exec(rootBlock[1])) !== null) {
        const key = m[1].trim();
        let val = m[2].trim();
        if (key === '--text-body') val = val.replace('px', '');
        overrides[key] = val;
    }
    return overrides;
}

class ThemeIO extends Component {
    fileInputRef = createRef();

    handleExport = () => {
        const design = getDesign();
        const palette = getPalette();
        let overrides = {};
        try {
            overrides = JSON.parse(localStorage.getItem(EDITOR_KEY) || '{}');
        } catch {}
        const css = buildCss(design, palette, overrides);
        const blob = new Blob([css], { type: 'text/css' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tg-theme-${design}${palette ? '-' + palette : ''}.css`;
        a.click();
        URL.revokeObjectURL(url);
    };

    handleImportClick = () => {
        this.fileInputRef.current && this.fileInputRef.current.click();
    };

    handleFileChange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const overrides = parseCssOverrides(ev.target.result);
            if (Object.keys(overrides).length === 0) return;
            localStorage.setItem(EDITOR_KEY, JSON.stringify(overrides));
            const root = document.documentElement;
            Object.entries(overrides).forEach(([k, v]) => {
                if (v) root.style.setProperty(k, k === '--text-body' ? `${v}px` : v);
            });
            if (this.props.onImport) this.props.onImport(overrides);
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    render() {
        return (
            <div className='theme-io'>
                <button className='theme-io-btn' onClick={this.handleExport}>
                    Exportar tema (.css)
                </button>
                <button className='theme-io-btn theme-io-btn--import' onClick={this.handleImportClick}>
                    Importar tema (.css)
                </button>
                <input
                    ref={this.fileInputRef}
                    type='file'
                    accept='.css'
                    style={{ display: 'none' }}
                    onChange={this.handleFileChange}
                />
            </div>
        );
    }
}

export default ThemeIO;
