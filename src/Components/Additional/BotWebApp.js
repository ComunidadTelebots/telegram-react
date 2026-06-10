import React, { Component } from 'react';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import IconButton from '@material-ui/core/IconButton';
import CircularProgress from '@material-ui/core/CircularProgress';
import './BotWebApp.css';

class BotWebApp extends Component {
    constructor(props) {
        super(props);
        this.state = { open: false, url: '', title: '', loading: true };
    }

    open(url, title = 'Bot') {
        this.setState({ open: true, url, title, loading: true });
    }

    close = () => this.setState({ open: false, url: '' });

    handleLoad = () => this.setState({ loading: false });

    render() {
        const { open, url, title, loading } = this.state;
        if (!open) return null;

        return (
            <div className='bot-webapp-overlay'>
                <div className='bot-webapp-panel'>
                    <div className='bot-webapp-header'>
                        <IconButton onClick={this.close} size='small'>
                            <ArrowBackIcon />
                        </IconButton>
                        <span className='bot-webapp-title'>{title}</span>
                    </div>
                    <div className='bot-webapp-body'>
                        {loading && (
                            <div className='bot-webapp-loading'>
                                <CircularProgress size={32} />
                            </div>
                        )}
                        <iframe
                            className='bot-webapp-frame'
                            src={url}
                            title={title}
                            sandbox='allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox'
                            allow='camera; microphone; geolocation'
                            onLoad={this.handleLoad}
                            style={{ opacity: loading ? 0 : 1 }}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default BotWebApp;
