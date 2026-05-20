/*
 * AmpViewer — muestra una página AMP en un visor iframe in-app.
 * Usa Google AMP Cache (cdn.ampproject.org) para carga rápida.
 * Si la página no tiene versión AMP, cae al navegador externo.
 */

import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import CircularProgress from '@material-ui/core/CircularProgress';
import Tooltip from '@material-ui/core/Tooltip';
import CloseIcon from '@material-ui/icons/Close';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import BrokenImageIcon from '@material-ui/icons/BrokenImage';
import './AmpViewer.css';

function buildAmpCacheUrl(url) {
    try {
        const u = new URL(url);
        if (u.protocol !== 'https:') return null;
        // AMP Cache domain encoding: escape dashes, then replace dots with dashes
        const encodedDomain = u.hostname.replace(/-/g, '--').replace(/\./g, '-');
        return `https://${encodedDomain}.cdn.ampproject.org/c/s/${u.hostname}${u.pathname}${u.search}`;
    } catch {
        return null;
    }
}

class AmpViewer extends React.Component {
    constructor(props) {
        super(props);
        this.state = { loading: true, error: false };
        this.iframeRef = React.createRef();
        this._errorTimer = null;
    }

    componentDidMount() {
        // AMP Cache pages that fail to load won't fire iframe onError.
        // Use a timeout: if the iframe hasn't sent an AMP ready message in 8s,
        // consider it a non-AMP page and offer to open externally.
        this._errorTimer = setTimeout(() => {
            if (this.state.loading) {
                this.setState({ loading: false, error: true });
            }
        }, 8000);

        window.addEventListener('message', this.onMessage);
        document.addEventListener('keydown', this.onKeyDown);
    }

    componentWillUnmount() {
        clearTimeout(this._errorTimer);
        window.removeEventListener('message', this.onMessage);
        document.removeEventListener('keydown', this.onKeyDown);
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

    render() {
        const { url, onClose } = this.props;
        const { loading, error } = this.state;

        const ampUrl = buildAmpCacheUrl(url) || url;
        let hostname = '';
        try {
            hostname = new URL(url).hostname;
        } catch {}

        return (
            <div className='amp-viewer' onClick={onClose}>
                <div className='amp-viewer-container' onClick={e => e.stopPropagation()}>
                    <div className='amp-viewer-header'>
                        <div className='amp-viewer-title'>
                            <span className='amp-viewer-badge'>AMP</span>
                            <span className='amp-viewer-origin'>{hostname}</span>
                        </div>
                        <div className='amp-viewer-actions'>
                            <Tooltip title='Abrir en navegador'>
                                <IconButton size='small' onClick={this.onOpenExternal}>
                                    <OpenInNewIcon fontSize='small' />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title='Cerrar'>
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
                                <p>Esta página no tiene versión AMP.</p>
                                <button className='amp-viewer-open-btn' onClick={this.onOpenExternal}>
                                    Abrir en navegador
                                </button>
                            </div>
                        ) : (
                            <iframe
                                ref={this.iframeRef}
                                className='amp-viewer-iframe'
                                src={ampUrl}
                                title='AMP Preview'
                                onLoad={this.onIframeLoad}
                                sandbox='allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-top-navigation-by-user-activation'
                                referrerPolicy='no-referrer'
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default AmpViewer;
