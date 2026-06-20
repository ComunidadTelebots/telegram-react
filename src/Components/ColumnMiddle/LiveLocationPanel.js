import React from 'react';
import Button from '@material-ui/core/Button';
import TdLibController from '../../Controllers/TdLibController';
import './LiveLocationPanel.css';

class LiveLocationPanel extends React.Component {
    state = {
        active: false,
        secondsLeft: 0,
        chatId: null,
        messageId: null,
        period: 3600,
    };

    _interval = null;
    _geoInterval = null;

    start(chatId, messageId, period) {
        if (this._interval) clearInterval(this._interval);
        if (this._geoInterval) clearInterval(this._geoInterval);

        this.setState({ active: true, chatId, messageId, period, secondsLeft: period });

        this._interval = setInterval(() => {
            this.setState(prev => {
                if (prev.secondsLeft <= 1) {
                    this._stopAll();
                    return { active: false, secondsLeft: 0 };
                }
                return { secondsLeft: prev.secondsLeft - 1 };
            });
        }, 1000);

        // update geo every 30 seconds
        this._geoInterval = setInterval(() => {
            this._pushGeoUpdate();
        }, 30000);
    }

    _pushGeoUpdate() {
        const { chatId, messageId } = this.state;
        if (!chatId || !messageId) return;
        navigator.geolocation &&
            navigator.geolocation.getCurrentPosition(pos => {
                TdLibController.send({
                    '@type': 'editLiveLocation',
                    chat_id: chatId,
                    message_id: messageId,
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                    heading: pos.coords.heading || undefined,
                }).catch(() => {});
            });
    }

    _stopAll() {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
        if (this._geoInterval) {
            clearInterval(this._geoInterval);
            this._geoInterval = null;
        }
    }

    handleStop = async () => {
        const { chatId, messageId } = this.state;
        this._stopAll();
        this.setState({ active: false });
        if (chatId && messageId) {
            try {
                await TdLibController.send({
                    '@type': 'editLiveLocation',
                    chat_id: chatId,
                    message_id: messageId,
                    stopped: true,
                });
            } catch (e) {}
        }
    };

    componentWillUnmount() {
        this._stopAll();
    }

    _fmt(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }

    render() {
        const { active, secondsLeft } = this.state;
        if (!active) return null;
        return (
            <div className='live-location-panel'>
                <span className='live-location-dot' />
                <span className='live-location-label'>Ubicación en vivo</span>
                <span className='live-location-timer'>{this._fmt(secondsLeft)}</span>
                <Button className='live-location-stop' size='small' onClick={this.handleStop}>
                    Detener
                </Button>
            </div>
        );
    }
}

export default LiveLocationPanel;
