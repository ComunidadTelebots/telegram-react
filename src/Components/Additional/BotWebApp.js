import React, { Component } from 'react';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import IconButton from '@material-ui/core/IconButton';
import CircularProgress from '@material-ui/core/CircularProgress';
import TdLibController from '../../Controllers/TdLibController';
import './BotWebApp.css';

function getThemeParams() {
    const style = getComputedStyle(document.documentElement);
    const get = v => style.getPropertyValue(v).trim() || undefined;
    return {
        bg_color: get('--design-page-background') || '#ffffff',
        text_color: get('--fg1') || '#000000',
        hint_color: get('--fg3') || '#999999',
        link_color: get('--color-accent-main') || '#2196f3',
        button_color: get('--color-accent-main') || '#2196f3',
        button_text_color: '#ffffff',
        secondary_bg_color: get('--design-panel-background') || '#f0f0f0',
    };
}

class BotWebApp extends Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            url: '',
            title: '',
            loading: true,
            mainButton: null,
            backgroundColor: null,
            expanded: false,
        };
        this.iframeRef = React.createRef();
        this._chatId = null;
        this._botUserId = null;
        this._queryId = null;
    }

    open(url, title = 'Bot', chatId = null, botUserId = null, queryId = null) {
        this._chatId = chatId;
        this._botUserId = botUserId;
        this._queryId = queryId;
        this.setState({
            open: true,
            url,
            title,
            loading: true,
            mainButton: null,
            backgroundColor: null,
            expanded: false,
        });
    }

    close = () => {
        this.setState({ open: false, url: '', mainButton: null });
        this._queryId = null;
    };

    handleLoad = () => {
        this.setState({ loading: false });
        this._sendToFrame({ eventType: 'theme_changed', eventData: { theme_params: getThemeParams() } });
        const panel = document.querySelector('.bot-webapp-panel');
        const h = panel ? panel.clientHeight - 52 : window.innerHeight - 52;
        this._sendToFrame({ eventType: 'viewport_changed', eventData: { height: h, is_state_stable: true } });
    };

    _sendToFrame(msg) {
        try {
            const frame = this.iframeRef.current;
            if (frame && frame.contentWindow) {
                frame.contentWindow.postMessage(JSON.stringify(msg), '*');
            }
        } catch {}
    }

    componentDidMount() {
        window.addEventListener('message', this._handleMessage);
    }

    componentWillUnmount() {
        window.removeEventListener('message', this._handleMessage);
    }

    _handleMessage = e => {
        if (!this.state.open) return;
        let data;
        try {
            data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        } catch {
            return;
        }
        if (!data || !data.eventType) return;
        const { eventType, eventData = {} } = data;

        switch (eventType) {
            case 'web_app_ready':
                this._sendToFrame({ eventType: 'theme_changed', eventData: { theme_params: getThemeParams() } });
                break;
            case 'web_app_close':
                this.close();
                break;
            case 'web_app_expand':
                this.setState({ expanded: true });
                break;
            case 'web_app_request_theme':
                this._sendToFrame({ eventType: 'theme_changed', eventData: { theme_params: getThemeParams() } });
                break;
            case 'web_app_request_viewport':
                {
                    const panel = document.querySelector('.bot-webapp-panel');
                    const h = panel ? panel.clientHeight - 52 : window.innerHeight - 52;
                    this._sendToFrame({
                        eventType: 'viewport_changed',
                        eventData: { height: h, is_state_stable: true },
                    });
                }
                break;
            case 'web_app_open_link':
                if (eventData.url) window.open(eventData.url, '_blank', 'noopener,noreferrer');
                break;
            case 'web_app_open_tg_link':
                if (eventData.path_full)
                    window.open('https://t.me' + eventData.path_full, '_blank', 'noopener,noreferrer');
                break;
            case 'web_app_setup_main_button':
                this.setState({ mainButton: { ...eventData } });
                break;
            case 'web_app_setup_back_button':
                break;
            case 'web_app_set_background_color':
                this.setState({ backgroundColor: eventData.color || null });
                break;
            case 'web_app_set_header_color':
                break;
            case 'web_app_data_send':
                if (this._chatId && eventData.data) {
                    TdLibController.send({
                        '@type': 'sendMessage',
                        chat_id: this._chatId,
                        input_message_content: {
                            '@type': 'inputMessageText',
                            text: { '@type': 'formattedText', text: eventData.data },
                        },
                    }).catch(() => {});
                }
                this.close();
                break;
            case 'web_app_trigger_haptic_feedback':
                break;
            case 'web_app_read_text_from_clipboard':
                navigator.clipboard
                    ?.readText()
                    .then(text => {
                        this._sendToFrame({
                            eventType: 'clipboard_text_received',
                            eventData: { req_id: eventData.req_id, data: text },
                        });
                    })
                    .catch(() => {
                        this._sendToFrame({
                            eventType: 'clipboard_text_received',
                            eventData: { req_id: eventData.req_id, data: '' },
                        });
                    });
                break;
            default:
                break;
        }
    };

    handleMainButtonClick = () => {
        this._sendToFrame({ eventType: 'main_button_pressed' });
    };

    handleOpenExternal = () => {
        window.open(this.state.url, '_blank', 'noopener,noreferrer');
    };

    render() {
        const { open, url, title, loading, mainButton, backgroundColor, expanded } = this.state;
        if (!open) return null;

        const mainBtnVisible = mainButton && mainButton.is_visible;

        return (
            <div className='bot-webapp-overlay'>
                <div className={`bot-webapp-panel${expanded ? ' bot-webapp-expanded' : ''}`}>
                    <div className='bot-webapp-header'>
                        <IconButton onClick={this.close} size='small'>
                            <ArrowBackIcon />
                        </IconButton>
                        <span className='bot-webapp-title'>{title}</span>
                        <IconButton onClick={this.handleOpenExternal} size='small' title='Abrir en navegador'>
                            <OpenInNewIcon fontSize='small' />
                        </IconButton>
                    </div>
                    <div className='bot-webapp-body' style={backgroundColor ? { background: backgroundColor } : {}}>
                        {loading && (
                            <div className='bot-webapp-loading'>
                                <CircularProgress size={32} />
                            </div>
                        )}
                        <iframe
                            ref={this.iframeRef}
                            className='bot-webapp-frame'
                            src={url}
                            title={title}
                            sandbox='allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads'
                            allow='camera; microphone; geolocation; clipboard-read; clipboard-write'
                            onLoad={this.handleLoad}
                            style={{ opacity: loading ? 0 : 1 }}
                        />
                    </div>
                    {mainBtnVisible && (
                        <button
                            className='bot-webapp-main-btn'
                            style={{
                                background: mainButton.color || 'var(--color-accent-main)',
                                color: mainButton.text_color || '#fff',
                                opacity: mainButton.is_active === false ? 0.5 : 1,
                            }}
                            disabled={mainButton.is_active === false}
                            onClick={this.handleMainButtonClick}>
                            {mainButton.is_progress_visible ? (
                                <CircularProgress size={18} style={{ color: mainButton.text_color || '#fff' }} />
                            ) : (
                                mainButton.text || 'OK'
                            )}
                        </button>
                    )}
                </div>
            </div>
        );
    }
}

export default BotWebApp;
