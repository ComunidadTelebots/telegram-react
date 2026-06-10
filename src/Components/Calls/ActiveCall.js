import React, { Component, createRef } from 'react';
import CallEndIcon from '@material-ui/icons/CallEnd';
import MicIcon from '@material-ui/icons/Mic';
import MicOffIcon from '@material-ui/icons/MicOff';
import VideocamIcon from '@material-ui/icons/Videocam';
import VideocamOffIcon from '@material-ui/icons/VideocamOff';
import UserStore from '../../Stores/UserStore';
import { getUserFullName } from '../../Utils/User';
import callController, { CallState } from '../../Controllers/CallController';
import './ActiveCall.css';

function formatDuration(secs) {
    const m = Math.floor(secs / 60)
        .toString()
        .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

class ActiveCall extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            muted: false,
            videoEnabled: false,
            isVideo: false,
            duration: 0,
            callerName: '',
            callerInitials: '',
        };
        this.localVideoRef = createRef();
        this.remoteVideoRef = createRef();
    }

    componentDidMount() {
        callController.on('stateChanged', this._onStateChanged);
        callController.on('duration', this._onDuration);
        callController.on('localStream', this._onLocalStream);
        callController.on('remoteStream', this._onRemoteStream);
        callController.on('muteChanged', muted => this.setState({ muted }));
        callController.on('videoChanged', enabled => this.setState({ videoEnabled: enabled }));
    }

    componentWillUnmount() {
        callController.off('stateChanged', this._onStateChanged);
        callController.off('duration', this._onDuration);
        callController.off('localStream', this._onLocalStream);
        callController.off('remoteStream', this._onRemoteStream);
    }

    _onStateChanged = state => {
        if (state === CallState.ACTIVE) {
            const info = callController.callInfo;
            const user = info && UserStore.get(info.userId);
            const name = user ? getUserFullName(user) : 'Unknown';
            const initials = name
                .split(' ')
                .map(w => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
            this.setState({
                visible: true,
                isVideo: info && info.isVideo,
                videoEnabled: info && info.isVideo,
                callerName: name,
                callerInitials: initials,
                duration: 0,
                muted: false,
            });
        } else if (state === CallState.IDLE || state === CallState.ENDED) {
            this.setState({ visible: false });
            if (this.localVideoRef.current) this.localVideoRef.current.srcObject = null;
            if (this.remoteVideoRef.current) this.remoteVideoRef.current.srcObject = null;
        }
    };

    _onDuration = duration => this.setState({ duration });

    _onLocalStream = stream => {
        if (this.localVideoRef.current) {
            this.localVideoRef.current.srcObject = stream;
        }
    };

    _onRemoteStream = stream => {
        if (this.remoteVideoRef.current) {
            this.remoteVideoRef.current.srcObject = stream;
        }
    };

    handleMute = () => {
        const next = !this.state.muted;
        callController.setMuted(next);
        this.setState({ muted: next });
    };

    handleVideo = () => {
        const next = !this.state.videoEnabled;
        callController.setVideoEnabled(next);
        this.setState({ videoEnabled: next });
    };

    handleHangUp = () => {
        callController.discardCall('hangup');
    };

    render() {
        const { visible, muted, videoEnabled, isVideo, duration, callerName, callerInitials } = this.state;
        if (!visible) return null;

        return (
            <div className='active-call-overlay'>
                <div className={`active-call-panel${isVideo ? ' active-call-panel--video' : ''}`}>
                    {isVideo && (
                        <>
                            <video
                                ref={this.remoteVideoRef}
                                className='active-call-remote-video'
                                autoPlay
                                playsInline
                            />
                            <video
                                ref={this.localVideoRef}
                                className='active-call-local-video'
                                autoPlay
                                playsInline
                                muted
                            />
                        </>
                    )}
                    {!isVideo && <div className='active-call-avatar'>{callerInitials}</div>}
                    <div className='active-call-name'>{callerName}</div>
                    <div className='active-call-duration'>{formatDuration(duration)}</div>
                    <div className='active-call-actions'>
                        <button
                            className={`active-call-btn${muted ? ' active-call-btn--off' : ''}`}
                            onClick={this.handleMute}
                            title={muted ? 'Unmute' : 'Mute'}>
                            {muted ? <MicOffIcon /> : <MicIcon />}
                        </button>
                        {isVideo && (
                            <button
                                className={`active-call-btn${!videoEnabled ? ' active-call-btn--off' : ''}`}
                                onClick={this.handleVideo}
                                title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}>
                                {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                            </button>
                        )}
                        <button
                            className='active-call-btn active-call-btn--hangup'
                            onClick={this.handleHangUp}
                            title='Hang up'>
                            <CallEndIcon />
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default ActiveCall;
