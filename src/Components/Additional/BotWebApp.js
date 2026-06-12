import React, { Component } from 'react';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import IconButton from '@material-ui/core/IconButton';
import CircularProgress from '@material-ui/core/CircularProgress';
import TdLibController from '../../Controllers/TdLibController';
import './BotWebApp.css';

function cssColorToHex(value) {
    if (!value) return undefined;
    value = value.trim();
    if (/^#[0-9a-fA-F]{3,8}$/.test(value)) {
        if (value.length === 4) {
            return '#' + value[1] + value[1] + value[2] + value[2] + value[3] + value[3];
        }
        return value.slice(0, 7);
    }
    try {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = value;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    } catch {
        return undefined;
    }
}

function getThemeParams() {
    const style = getComputedStyle(document.documentElement);
    const get = v => cssColorToHex(style.getPropertyValue(v).trim());
    return {
        bg_color: get('--design-page-background') || '#ffffff',
        text_color: get('--fg1') || '#000000',
        hint_color: get('--fg3') || '#999999',
        link_color: get('--color-accent-main') || '#2196f3',
        button_color: get('--color-accent-main') || '#2196f3',
        button_text_color: '#ffffff',
        secondary_bg_color: get('--design-panel-background') || '#f0f0f0',
        subtitle_text_color: get('--fg2') || '#777777',
        destructive_text_color: '#e53935',
        section_bg_color: get('--design-panel-background') || '#f0f0f0',
        section_header_text_color: get('--color-accent-main') || '#2196f3',
        accent_text_color: get('--color-accent-main') || '#2196f3',
        header_bg_color: get('--design-panel-background') || '#f0f0f0',
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
            secondaryButton: null,
            backButtonVisible: false,
            backgroundColor: null,
            headerColor: null,
            expanded: false,
            confirmClose: false,
            popup: null,
            headerColorKey: null,
        };
        this.iframeRef = React.createRef();
        this._chatId = null;
        this._botUserId = null;
        this._queryId = null;
        this._prolongInterval = null;
    }

    open(url, title = 'Bot', chatId = null, botUserId = null, queryId = null) {
        this._chatId = chatId;
        this._botUserId = botUserId;
        this._queryId = queryId;
        this._startProlong();
        this.setState({
            open: true,
            url,
            title,
            loading: true,
            mainButton: null,
            secondaryButton: null,
            backButtonVisible: false,
            backgroundColor: null,
            headerColor: null,
            expanded: false,
            confirmClose: false,
            popup: null,
            headerColorKey: null,
        });
    }

    close = (force = false) => {
        const { confirmClose } = this.state;
        if (!force && confirmClose) {
            if (!window.confirm('¿Cerrar la aplicación?')) return;
        }
        this._stopProlong();
        this.setState({ open: false, url: '', mainButton: null, secondaryButton: null, popup: null });
        this._queryId = null;
    };

    _startProlong() {
        this._stopProlong();
        if (!this._queryId || this._queryId === '0') return;
        this._prolongInterval = setInterval(() => {
            if (this._queryId && this._chatId && this._botUserId) {
                TdLibController.send({
                    '@type': 'prolongWebView',
                    bot_user_id: this._botUserId,
                    chat_id: this._chatId,
                    query_id: this._queryId,
                }).catch(() => {});
            }
        }, 25000);
    }

    _stopProlong() {
        if (this._prolongInterval) {
            clearInterval(this._prolongInterval);
            this._prolongInterval = null;
        }
    }

    handleLoad = () => {
        this.setState({ loading: false });
        this._sendToFrame({ eventType: 'theme_changed', eventData: { theme_params: getThemeParams() } });
        this._notifyViewport(true);
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
        this._setupResizeObserver();
    }

    componentDidUpdate(prevProps, prevState) {
        if (!prevState.open && this.state.open) {
            this._setupResizeObserver();
        }
        if (prevState.expanded !== this.state.expanded) {
            setTimeout(() => this._notifyViewport(true), 210);
        }
    }

    componentWillUnmount() {
        window.removeEventListener('message', this._handleMessage);
        if (this._resizeObserver) this._resizeObserver.disconnect();
        this._stopProlong();
    }

    _setupResizeObserver() {
        if (typeof ResizeObserver === 'undefined') return;
        if (this._resizeObserver) return;
        const panel = document.querySelector('.bot-webapp-panel');
        if (!panel) return;
        this._resizeObserver = new ResizeObserver(() => this._notifyViewport(false));
        this._resizeObserver.observe(panel);
    }

    _notifyViewport(stable = true) {
        const panel = document.querySelector('.bot-webapp-panel');
        const h = panel ? panel.clientHeight - 52 : window.innerHeight - 52;
        this._sendToFrame({ eventType: 'viewport_changed', eventData: { height: h, is_state_stable: stable } });
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
                this._notifyViewport(true);
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
            case 'web_app_setup_secondary_button':
                this.setState({ secondaryButton: { ...eventData } });
                break;
            case 'web_app_setup_back_button':
                this.setState({ backButtonVisible: !!eventData.is_visible });
                break;
            case 'web_app_set_background_color':
                this.setState({ backgroundColor: eventData.color || null });
                break;
            case 'web_app_set_header_color':
                this.setState({ headerColor: eventData.color || null, headerColorKey: eventData.color_key || null });
                break;
            case 'web_app_set_bottom_bar_color':
                break;
            case 'web_app_setup_closing_behavior':
                this.setState({ confirmClose: !!eventData.need_confirmation });
                break;
            case 'web_app_open_popup': {
                const { title: popupTitle, message, buttons } = eventData;
                const btns = Array.isArray(buttons) && buttons.length > 0 ? buttons : [{ id: 'ok', type: 'ok' }];
                const popupId = `popup_${Date.now()}`;
                this.setState({ popup: { id: popupId, title: popupTitle, message, buttons: btns } });
                break;
            }
            case 'web_app_close_scan_qr_popup':
                this._sendToFrame({ eventType: 'scan_qr_popup_closed', eventData: {} });
                break;
            case 'web_app_open_scan_qr_popup':
                this._sendToFrame({ eventType: 'qr_text_received', eventData: { data: '' } });
                break;
            case 'web_app_request_write_access':
                this._sendToFrame({ eventType: 'write_access_requested', eventData: { status: 'allowed' } });
                break;
            case 'web_app_request_phone':
                this._sendToFrame({ eventType: 'phone_requested', eventData: { status: 'sent' } });
                break;
            case 'web_app_switch_inline_query':
                if (eventData.query) {
                    this.close(true);
                }
                break;
            case 'web_app_invoke_custom_method':
                this._sendToFrame({
                    eventType: 'custom_method_invoked',
                    eventData: { req_id: eventData.req_id, result: null, error: 'Not supported' },
                });
                break;
            case 'web_app_share_to_story':
                break;
            case 'web_app_biometry_get_info':
                this._sendToFrame({ eventType: 'biometry_info_received', eventData: { available: false } });
                break;
            case 'web_app_biometry_request_access':
                this._sendToFrame({
                    eventType: 'biometry_info_received',
                    eventData: { available: false, access_requested: true, access_granted: false },
                });
                break;
            case 'web_app_biometry_request_auth':
                this._sendToFrame({
                    eventType: 'biometry_auth_requested',
                    eventData: { ok: false, error: 'NOT_AVAILABLE' },
                });
                break;
            case 'web_app_biometry_update_token':
                this._sendToFrame({ eventType: 'biometry_token_updated', eventData: { ok: false } });
                break;
            case 'web_app_biometry_open_settings':
                break;
            case 'web_app_data_send':
                if (this._botUserId && eventData.data) {
                    TdLibController.send({
                        '@type': 'sendWebViewData',
                        bot_user_id: this._botUserId,
                        button_text: eventData.button_text || '',
                        data: eventData.data,
                    }).catch(() => {});
                }
                this.close(true);
                break;
            case 'web_app_trigger_haptic_feedback':
                if (navigator.vibrate) {
                    const { type, impact_style, notification_type } = eventData;
                    if (type === 'impact') {
                        const ms = { light: 30, medium: 60, heavy: 100, rigid: 20, soft: 50 }[impact_style] || 40;
                        navigator.vibrate(ms);
                    } else if (type === 'notification') {
                        const pattern = { success: [40, 30, 40], warning: [60], error: [50, 30, 50, 30, 50] }[
                            notification_type
                        ] || [40];
                        navigator.vibrate(pattern);
                    } else if (type === 'selection_change') {
                        navigator.vibrate(15);
                    }
                }
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
            case 'web_app_open_invoice':
                this._sendToFrame({
                    eventType: 'invoice_closed',
                    eventData: { url: eventData.slug, status: 'cancelled' },
                });
                break;
            case 'web_app_request_fullscreen':
                this.setState({ expanded: true });
                this._sendToFrame({ eventType: 'fullscreen_changed', eventData: { is_fullscreen: true } });
                break;
            case 'web_app_exit_fullscreen':
                this.setState({ expanded: false });
                this._sendToFrame({ eventType: 'fullscreen_changed', eventData: { is_fullscreen: false } });
                break;
            case 'web_app_add_to_home_screen':
                this._sendToFrame({ eventType: 'home_screen_failed', eventData: { error: 'NOT_SUPPORTED' } });
                break;
            case 'web_app_check_home_screen':
                this._sendToFrame({ eventType: 'home_screen_checked', eventData: { status: 'unsupported' } });
                break;
            case 'web_app_set_emoji_status':
                this._sendToFrame({ eventType: 'emoji_status_failed', eventData: { error: 'NOT_SUPPORTED' } });
                break;
            case 'web_app_start_accelerometer':
                this._sendToFrame({ eventType: 'accelerometer_started' });
                break;
            case 'web_app_stop_accelerometer':
                this._sendToFrame({ eventType: 'accelerometer_stopped' });
                break;
            case 'web_app_start_device_orientation':
                this._sendToFrame({ eventType: 'device_orientation_started' });
                break;
            case 'web_app_stop_device_orientation':
                this._sendToFrame({ eventType: 'device_orientation_stopped' });
                break;
            case 'web_app_start_gyroscope':
                this._sendToFrame({ eventType: 'gyroscope_started' });
                break;
            case 'web_app_stop_gyroscope':
                this._sendToFrame({ eventType: 'gyroscope_stopped' });
                break;
            case 'web_app_request_location':
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        pos => {
                            this._sendToFrame({
                                eventType: 'location_checked',
                                eventData: {
                                    available: true,
                                    location: {
                                        latitude: pos.coords.latitude,
                                        longitude: pos.coords.longitude,
                                        altitude: pos.coords.altitude,
                                        course: pos.coords.heading,
                                        speed: pos.coords.speed,
                                        horizontal_accuracy: pos.coords.accuracy,
                                    },
                                },
                            });
                        },
                        () => {
                            this._sendToFrame({ eventType: 'location_checked', eventData: { available: false } });
                        },
                    );
                } else {
                    this._sendToFrame({ eventType: 'location_checked', eventData: { available: false } });
                }
                break;
            case 'web_app_open_location_picker':
                this._sendToFrame({ eventType: 'location_picker_failed', eventData: { error: 'NOT_SUPPORTED' } });
                break;
            case 'web_app_send_prepared_message':
                this._sendToFrame({ eventType: 'prepared_message_failed', eventData: { error: 'NOT_SUPPORTED' } });
                break;
            default:
                break;
        }
    };

    handleMainButtonClick = () => {
        this._sendToFrame({ eventType: 'main_button_pressed' });
    };

    handleSecondaryButtonClick = () => {
        this._sendToFrame({ eventType: 'secondary_button_pressed' });
    };

    handleBackButtonClick = () => {
        this._sendToFrame({ eventType: 'back_button_pressed' });
    };

    handleOpenExternal = () => {
        window.open(this.state.url, '_blank', 'noopener,noreferrer');
    };

    handlePopupButton = buttonId => {
        this._sendToFrame({ eventType: 'popup_closed', eventData: { button_id: buttonId } });
        this.setState({ popup: null });
    };

    _getPopupButtonLabel(btn) {
        if (btn.text) return btn.text;
        switch (btn.type) {
            case 'ok':
                return 'OK';
            case 'close':
                return 'Cerrar';
            case 'cancel':
                return 'Cancelar';
            case 'destructive':
                return btn.text || 'Eliminar';
            default:
                return 'OK';
        }
    }

    render() {
        const {
            open,
            url,
            title,
            loading,
            mainButton,
            secondaryButton,
            backButtonVisible,
            backgroundColor,
            headerColor,
            expanded,
            popup,
        } = this.state;
        if (!open) return null;

        const mainBtnVisible = mainButton && mainButton.is_visible;
        const secBtnVisible = secondaryButton && secondaryButton.is_visible;

        return (
            <div className='bot-webapp-overlay'>
                <div className={`bot-webapp-panel${expanded ? ' bot-webapp-expanded' : ''}`}>
                    <div className='bot-webapp-header' style={headerColor ? { background: headerColor } : {}}>
                        <IconButton onClick={backButtonVisible ? this.handleBackButtonClick : this.close} size='small'>
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
                        {popup && (
                            <div className='bot-webapp-popup-overlay'>
                                <div className='bot-webapp-popup'>
                                    {popup.title && <div className='bot-webapp-popup-title'>{popup.title}</div>}
                                    {popup.message && <div className='bot-webapp-popup-message'>{popup.message}</div>}
                                    <div className='bot-webapp-popup-buttons'>
                                        {popup.buttons.map(btn => (
                                            <button
                                                key={btn.id}
                                                className={`bot-webapp-popup-btn${
                                                    btn.type === 'destructive' ? ' destructive' : ''
                                                }`}
                                                onClick={() => this.handlePopupButton(btn.id)}>
                                                {this._getPopupButtonLabel(btn)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {secBtnVisible && (
                        <button
                            className='bot-webapp-secondary-btn'
                            style={{
                                background: secondaryButton.color || 'var(--design-panel-background)',
                                color: secondaryButton.text_color || 'var(--fg1)',
                                opacity: secondaryButton.is_active === false ? 0.5 : 1,
                            }}
                            disabled={secondaryButton.is_active === false}
                            onClick={this.handleSecondaryButtonClick}>
                            {secondaryButton.is_progress_visible ? (
                                <CircularProgress
                                    size={18}
                                    style={{ color: secondaryButton.text_color || 'var(--fg1)' }}
                                />
                            ) : (
                                secondaryButton.text || ''
                            )}
                        </button>
                    )}
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
