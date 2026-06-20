import React, { Component } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import CircularProgress from '@material-ui/core/CircularProgress';
import TdLibController from '../../Controllers/TdLibController';
import ApplicationStore from '../../Stores/ApplicationStore';
import './ChatThemePicker.css';

// Per-chat active theme: chatId → emoticon string ('' = no theme)
const chatThemeMap = new Map();

function intToHex(n) {
    if (!n) return null;
    const hex = (n >>> 0)
        .toString(16)
        .padStart(6, '0')
        .slice(-6);
    return `#${hex}`;
}

function getOrCreateStyleEl() {
    let el = document.getElementById('chat-theme-vars');
    if (!el) {
        el = document.createElement('style');
        el.id = 'chat-theme-vars';
        document.head.appendChild(el);
    }
    return el;
}

function applyThemeVars(chatId, themes) {
    const emoticon = chatThemeMap.get(chatId);
    const el = getOrCreateStyleEl();
    if (!el) return;

    if (!emoticon) {
        el.textContent = '';
        return;
    }

    const theme = themes && themes.find(t => t.emoticon === emoticon);
    if (!theme || !theme.settings || !theme.settings.length) {
        el.textContent = '';
        return;
    }

    const isNight = document.body.classList.contains('night');
    const nightBaseThemes = ['BaseThemeNight', 'BaseThemeTinted'];
    const settings =
        theme.settings.find(s =>
            isNight ? nightBaseThemes.includes(s.baseTheme) : !nightBaseThemes.includes(s.baseTheme),
        ) || theme.settings[0];

    const accent = intToHex(settings.accentColor);
    const outbox = intToHex(settings.outboxAccentColor);
    const msgColors = settings.messageColors || [];
    const bubble = msgColors.length ? intToHex(msgColors[0]) : null;

    let css = ':root {';
    if (accent) css += `--chat-theme-accent: ${accent};`;
    if (outbox) css += `--chat-theme-outbox: ${outbox};`;
    if (bubble) css += `--chat-theme-bubble: ${bubble};`;
    css += '}';
    el.textContent = css;
}

class ChatThemePicker extends Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            loading: false,
            themes: [],
            activeEmoticon: '',
            applying: false,
        };
    }

    open(chatId) {
        this._chatId = chatId;
        const active = chatThemeMap.get(chatId) || '';
        this.setState({ open: true, activeEmoticon: active });
        if (!this.state.themes.length) this._load();
    }

    _load = async () => {
        this.setState({ loading: true });
        try {
            const result = await TdLibController.send({ '@type': 'getChatThemes' });
            this.setState({ themes: result.themes || [], loading: false });
        } catch {
            this.setState({ loading: false });
        }
    };

    handleClose = () => {
        this.setState({ open: false });
    };

    handleSelect = async emoticon => {
        if (this.state.applying) return;
        const chatId = this._chatId;
        const prev = chatThemeMap.get(chatId) || '';

        // Optimistic update
        chatThemeMap.set(chatId, emoticon);
        this.setState({ activeEmoticon: emoticon, applying: true });
        applyThemeVars(chatId, this.state.themes);

        try {
            await TdLibController.send({ '@type': 'setChatTheme', chat_id: chatId, emoticon });
        } catch (e) {
            // Rollback
            chatThemeMap.set(chatId, prev);
            this.setState({ activeEmoticon: prev });
            applyThemeVars(chatId, this.state.themes);
            console.warn('[ChatThemePicker] setChatTheme error', e);
        } finally {
            this.setState({ applying: false });
        }
    };

    render() {
        const { open, loading, themes, activeEmoticon, applying } = this.state;

        return (
            <Dialog open={open} onClose={this.handleClose} maxWidth='sm' fullWidth>
                <DialogTitle>Chat theme</DialogTitle>
                <DialogContent className='chat-theme-picker-content'>
                    {loading && (
                        <div className='chat-theme-picker-loading'>
                            <CircularProgress size={28} />
                        </div>
                    )}
                    {!loading && (
                        <div className='chat-theme-picker-row'>
                            {/* No theme option */}
                            <button
                                className={`chat-theme-item${activeEmoticon === '' ? ' chat-theme-active' : ''}`}
                                onClick={() => this.handleSelect('')}
                                disabled={applying}
                                title='No theme'>
                                <span className='chat-theme-emoticon chat-theme-none'>✕</span>
                                <span className='chat-theme-label'>None</span>
                            </button>
                            {themes.map(t => (
                                <button
                                    key={t.emoticon}
                                    className={`chat-theme-item${
                                        activeEmoticon === t.emoticon ? ' chat-theme-active' : ''
                                    }`}
                                    onClick={() => this.handleSelect(t.emoticon)}
                                    disabled={applying}
                                    title={t.title || t.emoticon}>
                                    <span className='chat-theme-emoticon'>{t.emoticon}</span>
                                    <span className='chat-theme-label'>{t.title || t.emoticon}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        );
    }
}

// Helper used by external code to re-apply on theme mode change
ChatThemePicker.applyThemeVars = applyThemeVars;
ChatThemePicker.chatThemeMap = chatThemeMap;

export default ChatThemePicker;
