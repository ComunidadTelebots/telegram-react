/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import { PLAYER_PROGRESS_TIMEOUT_MS } from '../../../Constants';
import PlayerStore from '../../../Stores/PlayerStore';
import TdLibController from '../../../Controllers/TdLibController';
import './VoiceNoteSlider.css';

const styles = {};

function decodeWaveform(base64) {
    if (!base64) return null;
    try {
        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }

        const totalBits = bytes.length * 8;
        const totalValues = Math.floor(totalBits / 5);
        const values = [];

        for (let i = 0; i < totalValues; i++) {
            const bitIndex = i * 5;
            const byteIndex = Math.floor(bitIndex / 8);
            const bitOffset = bitIndex % 8;
            let value;
            if (bitOffset <= 3) {
                value = (bytes[byteIndex] >> bitOffset) & 0x1f;
            } else {
                value = ((bytes[byteIndex] >> bitOffset) | ((bytes[byteIndex + 1] || 0) << (8 - bitOffset))) & 0x1f;
            }
            values.push(value / 31);
        }
        return values.length > 0 ? values : null;
    } catch (e) {
        return null;
    }
}

const BAR_COUNT = 60;

function resampleWaveform(values, targetCount) {
    if (!values || values.length === 0) return null;
    const result = [];
    for (let i = 0; i < targetCount; i++) {
        const pos = (i / targetCount) * values.length;
        const idx = Math.floor(pos);
        result.push(values[Math.min(idx, values.length - 1)]);
    }
    return result;
}

class VoiceNoteSlider extends React.Component {
    constructor(props) {
        super(props);

        const { message, time } = PlayerStore;
        const { chatId, messageId, duration } = this.props;

        const active = message && message.chat_id === chatId && message.id === messageId;
        const currentTime = active && time ? time.currentTime : 0;
        const audioDuration = active && time && time.duration ? time.duration : duration;

        this.state = {
            active,
            currentTime,
            duration: audioDuration,
            value: this.getValue(currentTime, audioDuration, active),
            dragging: false,
        };

        const raw = decodeWaveform(props.waveform);
        this.bars = raw ? resampleWaveform(raw, BAR_COUNT) : null;
    }

    componentDidMount() {
        PlayerStore.on('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.on('clientUpdateMediaTime', this.onClientUpdateMediaTime);
        PlayerStore.on('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
    }

    componentWillUnmount() {
        PlayerStore.off('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.off('clientUpdateMediaTime', this.onClientUpdateMediaTime);
        PlayerStore.off('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
    }

    reset = () => {
        const { duration } = this.props;
        const { value } = this.state;

        if (value === 1) {
            this.setState({ active: false, currentTime: 0 });
            setTimeout(() => {
                const { currentTime } = this.state;
                if (!currentTime) {
                    this.setState({ value: this.getValue(0, duration, false) });
                }
            }, PLAYER_PROGRESS_TIMEOUT_MS);
        } else {
            this.setState({ active: false, currentTime: 0, value: this.getValue(0, duration, false) });
        }
    };

    onClientUpdateMediaEnd = update => {
        const { chatId, messageId } = this.props;
        if (chatId === update.chatId && messageId === update.messageId) {
            this.reset();
        }
    };

    onClientUpdateMediaTime = update => {
        const { chatId, messageId, duration } = this.props;
        const { active, dragging } = this.state;
        if (dragging) return;
        if (chatId === update.chatId && messageId === update.messageId) {
            this.setState({
                currentTime: update.currentTime,
                duration: update.duration || duration,
                value: this.getValue(update.currentTime, update.duration || duration, active),
            });
        }
    };

    onClientUpdateMediaActive = update => {
        const { chatId, messageId, duration } = this.props;
        const { active, currentTime } = this.state;

        if (chatId === update.chatId && messageId === update.messageId) {
            this.setState({
                active: true,
                currentTime: active ? currentTime : 0,
                value: this.getValue(active ? currentTime : 0, duration, true),
            });
        } else if (active) {
            this.reset();
        }
    };

    getValue = (currentTime, duration, active) => {
        return active && duration ? currentTime / duration : 0;
    };

    handleBarClick = e => {
        const { chatId, messageId } = this.props;
        const { active } = this.state;
        if (!active) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

        const { duration } = this.state;
        const seekTime = ratio * duration;

        this.setState({ value: ratio, currentTime: seekTime });
        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaSeek',
            chatId,
            messageId,
            currentTime: seekTime,
        });
    };

    render() {
        const { value } = this.state;
        const bars = this.bars;

        if (!bars) {
            // Fallback: flat line if no waveform data
            return (
                <div className='voice-note-slider'>
                    <div className='voice-waveform voice-waveform-flat' onClick={this.handleBarClick}>
                        {Array.from({ length: BAR_COUNT }).map((_, i) => (
                            <div
                                key={i}
                                className={`voice-bar voice-bar-flat ${
                                    i / BAR_COUNT < value ? 'voice-bar-played' : ''
                                }`}
                            />
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className='voice-note-slider'>
                <div className='voice-waveform' onClick={this.handleBarClick}>
                    {bars.map((amp, i) => (
                        <div
                            key={i}
                            className={`voice-bar ${i / BAR_COUNT < value ? 'voice-bar-played' : ''}`}
                            style={{ height: `${Math.max(15, Math.round(amp * 100))}%` }}
                        />
                    ))}
                </div>
            </div>
        );
    }
}

VoiceNoteSlider.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    duration: PropTypes.number.isRequired,
    waveform: PropTypes.string,
};

export default withStyles(styles)(VoiceNoteSlider);
