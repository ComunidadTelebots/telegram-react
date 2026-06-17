import React, { Component } from 'react';
import './AppearanceReset.css';

const ALL_APPEARANCE_KEYS = [
    'tg_design_editor',
    'tg_palette',
    'tg_chat_bg',
    'tg_chat_bg_type',
    'tg_chat_pattern',
    'tg_font_size',
    'tg_compact_mode',
    'tg_anim_speed',
    'tg_bubble_radius',
];

const CSS_VARS_TO_RESET = [
    '--color-accent-main',
    '--message-out-background',
    '--message-in-background',
    '--design-sidebar-background',
    '--design-middle-background',
    '--text-body',
    '--text-dialog',
    '--chat-bg-image',
    '--anim-speed',
    '--bubble-radius',
];

class AppearanceReset extends Component {
    constructor(props) {
        super(props);
        this.state = { confirmed: false };
    }

    handleReset = () => {
        if (!this.state.confirmed) {
            this.setState({ confirmed: true });
            setTimeout(() => this.setState({ confirmed: false }), 3000);
            return;
        }
        ALL_APPEARANCE_KEYS.forEach(k => localStorage.removeItem(k));
        CSS_VARS_TO_RESET.forEach(v => document.documentElement.style.removeProperty(v));
        document.body.className = document.body.className
            .split(' ')
            .filter(c => !c.startsWith('palette-') && !c.startsWith('chat-pattern-') && c !== 'display-compact')
            .join(' ');
        this.setState({ confirmed: false });
        if (this.props.onReset) this.props.onReset();
    };

    render() {
        const { confirmed } = this.state;
        return (
            <div className='appearance-reset'>
                <button
                    className={`appearance-reset-btn${confirmed ? ' appearance-reset-btn--confirm' : ''}`}
                    onClick={this.handleReset}>
                    {confirmed ? 'Confirmar restablecimiento' : 'Restablecer apariencia'}
                </button>
                {confirmed && (
                    <p className='appearance-reset-hint'>
                        Haz clic de nuevo para confirmar. Se restablecerán todos los ajustes de apariencia.
                    </p>
                )}
            </div>
        );
    }
}

export default AppearanceReset;
