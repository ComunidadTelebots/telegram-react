/*
 * AmpViewer — muestra una página AMP en un visor iframe in-app.
 * Fuente primaria: Google AMP Cache (cdn.ampproject.org)
 * Fuente de respaldo: Cloudflare AMP Cache (amp.cloudflare.com)
 */

import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import CircularProgress from '@material-ui/core/CircularProgress';
import Tooltip from '@material-ui/core/Tooltip';
import CloseIcon from '@material-ui/icons/Close';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import BrokenImageIcon from '@material-ui/icons/BrokenImage';
import { withTranslation } from 'react-i18next';
import './AmpViewer.css';

// Encode a hostname for AMP Cache subdomain:
//   1. Punycode-encode each label (handled by browser via URL API)
//   2. Replace each existing '-' with '--'
//   3. Replace each '.' with '-'
// Spec: https://amp.dev/documentation/guides-and-tutorials/learn/amp-caches-and-cors/amp-cache-urls/
function encodeAmpDomain(hostname) {
    return hostname.replace(/-/g, '--').replace(/\./g, '-');
}

function buildGoogleAmpUrl(url) {
    try {
        const u = new URL(url);
        if (u.protocol !== 'https:') return null;
        const encoded = encodeAmpDomain(u.hostname);
        return `https://${encoded}.cdn.ampproject.org/c/s/${u.hostname}${u.pathname}${u.search}`;
    } catch {
        return null;
    }
}

function buildCloudflareAmpUrl(url) {
    try {
        const u = new URL(url);
        if (u.protocol !== 'https:') return null;
        const encoded = encodeAmpDomain(u.hostname);
        return `https://${encoded}.amp.cloudflare.com/c/s/${u.hostname}${u.pathname}${u.search}`;
    } catch {
        return null;
    }
}

const LOAD_TIMEOUT_MS = 15000; // 15 s — margen para conexiones móviles lentas

class AmpViewer extends React.Component {
    constructor(props) {
        super(props);
        this.state = { loading: true, error: false, useFallback: false };
        this.iframeRef = React.createRef();
        this._errorTimer = null;
    }

    componentDidMount() {
        document.body.style.overflow = 'hidden';

        this._startTimer();
        window.addEventListener('message', this.onMessage);
        document.addEventListener('keydown', this.onKeyDown);
    }

    componentWillUnmount() {
        document.body.style.overflow = '';

        clearTimeout(this._errorTimer);
        window.removeEventListener('message', this.onMessage);
        document.removeEventListener('keydown', this.onKeyDown);
    }

    _startTimer() {
        clearTimeout(this._errorTimer);
        this._errorTimer = setTimeout(() => {
            if (this.state.loading && !this.state.useFallback) {
                // First timeout: try Cloudflare fallback
                this.setState({ loading: true, useFallback: true }, () => this._startTimer());
            } else if (this.state.loading) {
                // Second timeout: give up
                this.setState({ loading: false, error: true });
            }
        }, LOAD_TIMEOUT_MS);
    }

    onMessage = event => {
        // AMP runtime sends 'amp-' prefixed messages when the document is ready
        if (event.data && typeof event.data === 'string' && event.data.startsWith('amp-')) {
            clearTimeout(this._errorTimer);
            this.setState({ loading: false, error: false });
        }
    };

    onKeyDown = e => {
        if (e.key === 'Escape') this.props.onClose();
    };

    onIframeLoad = () => {
        clearTimeout(this._errorTimer);
        this.setState({ loading: false, error: false });
    };

    onOpenExternal = () => {
        const { url } = this.props;
        window.open(url, '_blank', 'noopener,noreferrer');
        this.props.onClose();
    };

    onBackdropClick = e => {
        // Only close on direct backdrop click, not on swipe/scroll events
        if (e.target === e.currentTarget) this.props.onClose();
    };

    render() {
        const { url, onClose, t } = this.props;
        const { loading, error, useFallback } = this.state;

        const ampUrl = useFallback ? buildCloudflareAmpUrl(url) || url : buildGoogleAmpUrl(url) || url;

        let hostname = '';
        try {
            hostname = new URL(url).hostname;
        } catch {}

        return (
            <div className='amp-viewer' onClick={this.onBackdropClick} style={{ touchAction: 'none' }}>
                <div className='amp-viewer-container' onClick={e => e.stopPropagation()}>
                    <div className='amp-viewer-header'>
                        <div className='amp-viewer-title'>
                            <span className='amp-viewer-badge'>AMP</span>
                            <span className='amp-viewer-origin'>{hostname}</span>
                        </div>
                        <div className='amp-viewer-actions'>
                            <Tooltip title={t('OpenInBrowser', 'Abrir en navegador')}>
                                <IconButton size='small' onClick={this.onOpenExternal}>
                                    <OpenInNewIcon fontSize='small' />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={t('Close', 'Cerrar')}>
                                <IconButton size='small' onClick={onClose}>
                                    <CloseIcon fontSize='small' />
                                </IconButton>
                            </Tooltip>
                        </div>
                    </div>

                    <div className='amp-viewer-body'>
                        {loading && (
                            <div className='amp-viewer-loading'>
                                <CircularProgress size={32} />
                            </div>
                        )}
                        {error ? (
                            <div className='amp-viewer-error'>
                                <BrokenImageIcon fontSize='large' />
                                <p>{t('AmpNotAvailable', 'Esta página no tiene versión AMP.')}</p>
                                <button className='amp-viewer-open-btn' onClick={this.onOpenExternal}>
                                    {t('OpenInBrowser', 'Abrir en navegador')}
                                </button>
                            </div>
                        ) : (
                            <iframe
                                key={useFallback ? 'fallback' : 'primary'}
                                ref={this.iframeRef}
                                className='amp-viewer-iframe'
                                src={ampUrl}
                                title='AMP Preview'
                                onLoad={this.onIframeLoad}
                                sandbox='allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-top-navigation-by-user-activation allow-modals'
                                referrerPolicy='no-referrer'
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default withTranslation()(AmpViewer);
