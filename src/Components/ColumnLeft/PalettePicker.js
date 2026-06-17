import React, { Component } from 'react';
import { getPalette, PALETTE_COLORS, PALETTE_LABELS, PALETTES, setPalette } from '../../Design';
import './PalettePicker.css';

class PalettePicker extends Component {
    constructor(props) {
        super(props);
        this.state = { palette: getPalette() };
    }

    handleSelect = name => {
        setPalette(name);
        this.setState({ palette: name });
        if (this.props.onChange) this.props.onChange(name);
    };

    render() {
        const { palette } = this.state;
        return (
            <div className='palette-picker'>
                <button
                    className={`palette-swatch palette-swatch--none${!palette ? ' selected' : ''}`}
                    title='Sin paleta'
                    onClick={() => this.handleSelect('')}>
                    <span className='palette-swatch-dot palette-swatch-dot--none' />
                    <span className='palette-swatch-label'>Ninguna</span>
                </button>
                {PALETTES.map(p => (
                    <button
                        key={p}
                        className={`palette-swatch${palette === p ? ' selected' : ''}`}
                        title={PALETTE_LABELS[p]}
                        onClick={() => this.handleSelect(p)}>
                        <span className='palette-swatch-dot' style={{ background: PALETTE_COLORS[p] }} />
                        <span className='palette-swatch-label'>{PALETTE_LABELS[p]}</span>
                    </button>
                ))}
            </div>
        );
    }
}

export default PalettePicker;
