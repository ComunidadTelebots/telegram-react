import React, { Component } from 'react';
import './DesignEditor.css';

const EDITOR_KEY = 'tg_design_editor';

const FIELDS = [
    { key: '--color-accent-main', label: 'Color acento', type: 'color', default: '' },
    { key: '--message-out-background', label: 'Burbuja saliente', type: 'color', default: '' },
    { key: '--message-in-background', label: 'Burbuja entrante', type: 'color', default: '' },
    { key: '--design-sidebar-background', label: 'Fondo sidebar', type: 'color', default: '' },
    { key: '--design-middle-background', label: 'Fondo chat', type: 'color', default: '' },
    { key: '--text-body', label: 'Tamaño fuente (px)', type: 'range', min: 11, max: 20, step: 1, default: '' },
];

function loadOverrides() {
    try {
        return JSON.parse(localStorage.getItem(EDITOR_KEY) || '{}');
    } catch {
        return {};
    }
}

function applyOverrides(overrides) {
    const root = document.documentElement;
    Object.entries(overrides).forEach(([k, v]) => {
        if (v) root.style.setProperty(k, k === '--text-body' ? `${v}px` : v);
        else root.style.removeProperty(k);
    });
}

export function initDesignEditor() {
    applyOverrides(loadOverrides());
}

class DesignEditor extends Component {
    constructor(props) {
        super(props);
        this.state = { overrides: loadOverrides(), open: false };
    }

    handleChange = (key, value) => {
        const overrides = { ...this.state.overrides, [key]: value };
        this.setState({ overrides });
        applyOverrides(overrides);
        localStorage.setItem(EDITOR_KEY, JSON.stringify(overrides));
    };

    handleReset = () => {
        localStorage.removeItem(EDITOR_KEY);
        const overrides = {};
        this.setState({ overrides });
        FIELDS.forEach(f => document.documentElement.style.removeProperty(f.key));
    };

    getCurrentValue(field) {
        const saved = this.state.overrides[field.key];
        if (saved) return saved;
        if (field.type === 'color') {
            const computed = getComputedStyle(document.documentElement)
                .getPropertyValue(field.key)
                .trim();
            return computed || '#5b8af1';
        }
        return field.min || 14;
    }

    render() {
        const hasOverrides = Object.values(this.state.overrides).some(v => v);
        return (
            <div className='design-editor'>
                <div className='design-editor-title'>
                    Editor de diseño
                    {hasOverrides && (
                        <button className='design-editor-reset' onClick={this.handleReset}>
                            Restablecer
                        </button>
                    )}
                </div>
                <div className='design-editor-fields'>
                    {FIELDS.map(field => (
                        <div key={field.key} className='design-editor-row'>
                            <label className='design-editor-label'>{field.label}</label>
                            {field.type === 'color' ? (
                                <input
                                    type='color'
                                    className='design-editor-color'
                                    value={this.getCurrentValue(field)}
                                    onChange={e => this.handleChange(field.key, e.target.value)}
                                />
                            ) : (
                                <div className='design-editor-range-wrap'>
                                    <input
                                        type='range'
                                        className='design-editor-range'
                                        min={field.min}
                                        max={field.max}
                                        step={field.step}
                                        value={parseInt(this.state.overrides[field.key] || 14, 10)}
                                        onChange={e => this.handleChange(field.key, e.target.value)}
                                    />
                                    <span className='design-editor-range-val'>
                                        {parseInt(this.state.overrides[field.key] || 14, 10)}px
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}

export default DesignEditor;
