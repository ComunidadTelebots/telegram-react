import React, { Component } from 'react';
import CallIcon from '@material-ui/icons/Call';
import CallEndIcon from '@material-ui/icons/CallEnd';
import VideocamIcon from '@material-ui/icons/Videocam';
import UserStore from '../../Stores/UserStore';
import { getUserFullName } from '../../Utils/User';
import callController, { CallState } from '../../Controllers/CallController';
import './IncomingCall.css';

class IncomingCall extends Component {
    constructor(props) {
        super(props);
        this.state = { visible: false, isVideo: false, callerName: '', callerInitials: '' };
    }

    componentDidMount() {
        callController.on('stateChanged', this._onStateChanged);
    }

    componentWillUnmount() {
        callController.off('stateChanged', this._onStateChanged);
    }

    _onStateChanged = state => {
        if (state === CallState.INCOMING) {
            const info = callController.callInfo;
            const user = info && UserStore.get(info.userId);
            const name = user ? getUserFullName(user) : 'Unknown';
            const initials = name
                .split(' ')
                .map(w => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
            this.setState({ visible: true, isVideo: info && info.isVideo, callerName: name, callerInitials: initials });
        } else if (state === CallState.ACTIVE || state === CallState.ENDED || state === CallState.IDLE) {
            this.setState({ visible: false });
        }
    };

    handleAccept = () => {
        callController.acceptCall();
    };

    handleDecline = () => {
        callController.discardCall('hangup');
    };

    render() {
        const { visible, isVideo, callerName, callerInitials } = this.state;
        if (!visible) return null;

        return (
            <div className='incoming-call-overlay'>
                <div className='incoming-call-panel'>
                    <div className='incoming-call-avatar'>{callerInitials}</div>
                    <div className='incoming-call-name'>{callerName}</div>
                    <div className='incoming-call-label'>{isVideo ? 'Incoming video call...' : 'Incoming call...'}</div>
                    <div className='incoming-call-actions'>
                        <button className='incoming-call-btn incoming-call-btn--decline' onClick={this.handleDecline}>
                            <CallEndIcon />
                        </button>
                        <button className='incoming-call-btn incoming-call-btn--accept' onClick={this.handleAccept}>
                            {isVideo ? <VideocamIcon /> : <CallIcon />}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default IncomingCall;
