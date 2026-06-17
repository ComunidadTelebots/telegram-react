import React, { Component } from 'react';
import { CHAT_PATTERN_LABELS, CHAT_PATTERNS, getChatPattern, setChatPattern } from '../../Design';
import './ChatPatternPicker.css';

const PATTERN_PREVIEWS = {
    dots: 'radial-gradient(circle, rgba(0,0,0,0.2) 1px, transparent 1px) 0 0 / 8px 8px',
    grid:
        'linear-gradient(rgba(0,0,0,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.15) 1px,transparent 1px) 0 0 / 8px 8px',
    diagonal: 'repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(0,0,0,0.15) 4px,rgba(0,0,0,0.15) 5px)',
    waves:
        'repeating-radial-gradient(circle at 0 50%,transparent 0,transparent 4px,rgba(0,0,0,0.15) 4px,rgba(0,0,0,0.15) 5px)',
    diamonds:
        'repeating-linear-gradient(45deg,rgba(0,0,0,0.1) 0,rgba(0,0,0,0.1) 1px,transparent 0,transparent 50%),repeating-linear-gradient(135deg,rgba(0,0,0,0.1) 0,rgba(0,0,0,0.1) 1px,transparent 0,transparent 50%) 0 0 / 8px 8px',
    hexagons:
        'repeating-linear-gradient(60deg,rgba(0,0,0,0.12) 0,rgba(0,0,0,0.12) 1px,transparent 0,transparent 12px) 0 0 / 7px 12px',
};

class ChatPatternPicker extends Component {
    constructor(props) {
        super(props);
        this.state = { pattern: getChatPattern() };
    }

    handleSelect = name => {
        setChatPattern(name);
        this.setState({ pattern: name });
    };

    render() {
        const { pattern } = this.state;
        return (
            <div className='chat-pattern-picker'>
                <div className='chat-pattern-title'>Patrón del chat</div>
                <div className='chat-pattern-list'>
                    <button
                        className={`chat-pattern-item${!pattern ? ' selected' : ''}`}
                        onClick={() => this.handleSelect('')}>
                        <span className='chat-pattern-preview chat-pattern-preview--none' />
                        <span className='chat-pattern-label'>Ninguno</span>
                    </button>
                    {CHAT_PATTERNS.map(p => (
                        <button
                            key={p}
                            className={`chat-pattern-item${pattern === p ? ' selected' : ''}`}
                            onClick={() => this.handleSelect(p)}>
                            <span className='chat-pattern-preview' style={{ background: PATTERN_PREVIEWS[p] }} />
                            <span className='chat-pattern-label'>{CHAT_PATTERN_LABELS[p]}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }
}

export default ChatPatternPicker;
