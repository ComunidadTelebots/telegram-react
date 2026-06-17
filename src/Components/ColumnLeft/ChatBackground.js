import React, { Component, createRef } from 'react';
import './ChatBackground.css';

const BG_KEY = 'tg_chat_bg';
const BG_TYPE_KEY = 'tg_chat_bg_type';

const PRESET_COLORS = ['#dfe4ea', '#c8d7e5', '#d2dcc4', '#e7d8c9', '#d4c5e2', '#c5dde8', '#f0e6c8', '#e8e8e8'];

export function initChatBackground() {
    const type = localStorage.getItem(BG_TYPE_KEY);
    const value = localStorage.getItem(BG_KEY);
    if (!type || !value) return;
    const middle = document.querySelector('.middle-column') || document.querySelector('.messages-list');
    if (!middle) return;
    if (type === 'color') {
        middle.style.setProperty('--design-middle-background', value);
    } else if (type === 'image') {
        middle.style.backgroundImage = `url(${value})`;
        middle.style.backgroundSize = 'cover';
        middle.style.backgroundPosition = 'center';
    }
}

class ChatBackground extends Component {
    fileInputRef = createRef();

    constructor(props) {
        super(props);
        this.state = {
            type: localStorage.getItem(BG_TYPE_KEY) || 'color',
            value: localStorage.getItem(BG_KEY) || '',
        };
    }

    applyBg = (type, value) => {
        localStorage.setItem(BG_TYPE_KEY, type);
        localStorage.setItem(BG_KEY, value);
        document.documentElement.style.setProperty('--design-middle-background', type === 'color' ? value : '');
        if (type === 'image') {
            document.documentElement.style.setProperty('--chat-bg-image', `url("${value}")`);
        } else {
            document.documentElement.style.removeProperty('--chat-bg-image');
        }
    };

    handleColorSelect = color => {
        this.setState({ type: 'color', value: color });
        this.applyBg('color', color);
    };

    handleColorInput = e => {
        const color = e.target.value;
        this.setState({ type: 'color', value: color });
        this.applyBg('color', color);
    };

    handleImageClick = () => {
        this.fileInputRef.current && this.fileInputRef.current.click();
    };

    handleFileChange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const dataUrl = ev.target.result;
            this.setState({ type: 'image', value: dataUrl });
            this.applyBg('image', dataUrl);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    handleReset = () => {
        localStorage.removeItem(BG_KEY);
        localStorage.removeItem(BG_TYPE_KEY);
        document.documentElement.style.removeProperty('--design-middle-background');
        document.documentElement.style.removeProperty('--chat-bg-image');
        this.setState({ type: 'color', value: '' });
    };

    render() {
        const { value, type } = this.state;
        return (
            <div className='chat-bg'>
                <div className='chat-bg-title'>Fondo del chat</div>
                <div className='chat-bg-presets'>
                    {PRESET_COLORS.map(c => (
                        <button
                            key={c}
                            className={`chat-bg-preset${type === 'color' && value === c ? ' selected' : ''}`}
                            style={{ background: c }}
                            onClick={() => this.handleColorSelect(c)}
                        />
                    ))}
                    <input
                        type='color'
                        className='chat-bg-custom-color'
                        title='Color personalizado'
                        value={type === 'color' && value ? value : '#dfe4ea'}
                        onChange={this.handleColorInput}
                    />
                </div>
                <div className='chat-bg-actions'>
                    <button className='chat-bg-img-btn' onClick={this.handleImageClick}>
                        Imagen personalizada
                    </button>
                    {(value || type === 'image') && (
                        <button className='chat-bg-reset' onClick={this.handleReset}>
                            Quitar fondo
                        </button>
                    )}
                </div>
                <input
                    ref={this.fileInputRef}
                    type='file'
                    accept='image/*'
                    style={{ display: 'none' }}
                    onChange={this.handleFileChange}
                />
            </div>
        );
    }
}

export default ChatBackground;
