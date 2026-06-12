/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import AudioAction from './AudioAction';
import VoiceNoteTile from '../../Tile/VoiceNoteTile';
import MediaStatus from './MediaStatus';
import VoiceNoteSlider from './VoiceNoteSlider';
import PlayerStore from '../../../Stores/PlayerStore';
import TdLibController from '../../../Controllers/TdLibController';
import './VoiceNote.css';

const SPEEDS = [1.0, 1.5, 2.0];

class VoiceNoteSpeedButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = { playbackRate: PlayerStore.playbackRate || 1.0 };
    }

    componentDidMount() {
        PlayerStore.on('clientUpdateMediaPlaybackRate', this.onRateUpdate);
    }

    componentWillUnmount() {
        PlayerStore.off('clientUpdateMediaPlaybackRate', this.onRateUpdate);
    }

    onRateUpdate = ({ playbackRate }) => this.setState({ playbackRate });

    handleClick = e => {
        e.stopPropagation();
        const { playbackRate } = this.state;
        const idx = SPEEDS.indexOf(playbackRate);
        const next = SPEEDS[(idx + 1) % SPEEDS.length];
        TdLibController.clientUpdate({ '@type': 'clientUpdateMediaPlaybackRate', playbackRate: next });
    };

    render() {
        const { playbackRate } = this.state;
        const label = playbackRate === 1.5 ? '1.5×' : playbackRate === 2.0 ? '2×' : '1×';
        const active = playbackRate !== 1.0;
        return (
            <button
                className={classNames('voice-speed-btn', { 'voice-speed-active': active })}
                onClick={this.handleClick}
                title='Velocidad de reproducción'>
                {label}
            </button>
        );
    }
}

const styles = theme => ({
    voiceNoteMeta: {
        color: theme.palette.text.secondary,
    },
});

class VoiceNote extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            transcribing: false,
            transcription: '',
            transcriptionError: '',
        };
    }

    componentDidMount() {
        TdLibController.addListener('update', this.onUpdate);
    }

    componentWillUnmount() {
        TdLibController.off('update', this.onUpdate);
    }

    onUpdate = update => {
        const { chatId, messageId } = this.props;
        if (!update || update['@type'] !== 'updateTranscribedAudio') return;
        if (update.chat_id !== chatId || update.message_id !== messageId) return;
        if (update.pending) {
            this.setState({ transcribing: true, transcriptionError: '' });
            return;
        }

        this.setState({
            transcribing: false,
            transcription: update.text || '',
            transcriptionError: '',
        });
    };

    handleTranscribe = async event => {
        event.stopPropagation();

        const { chatId, messageId } = this.props;
        this.setState({ transcribing: true, transcriptionError: '' });

        try {
            const result = await TdLibController.send({
                '@type': 'transcribeAudio',
                chat_id: chatId,
                message_id: messageId,
            });

            this.setState({
                transcribing: !!result.pending,
                transcription: result.text || '',
                transcriptionError: '',
            });
        } catch (error) {
            this.setState({
                transcribing: false,
                transcriptionError: error.message || 'Transcription failed',
            });
        }
    };

    render() {
        const { chatId, messageId, voiceNote, openMedia, classes } = this.props;
        const { transcribing, transcription, transcriptionError } = this.state;
        if (!voiceNote) return null;

        const { duration, voice: file, waveform } = voiceNote;

        return (
            <div className='document'>
                <VoiceNoteTile chatId={chatId} messageId={messageId} file={file} openMedia={openMedia} />
                <div className='voice-note-content'>
                    <VoiceNoteSlider
                        chatId={chatId}
                        messageId={messageId}
                        duration={duration}
                        file={file}
                        waveform={waveform}
                    />
                    <div className={classNames(classes.voiceNoteMeta, 'voice-note-meta')}>
                        <AudioAction chatId={chatId} messageId={messageId} duration={duration} file={file} />
                        <MediaStatus chatId={chatId} messageId={messageId} icon={' •'} />
                        <VoiceNoteSpeedButton />
                        <button
                            className='voice-transcribe-btn'
                            onClick={this.handleTranscribe}
                            disabled={transcribing}
                            title='Transcribe voice message'>
                            {transcribing ? '...' : 'TXT'}
                        </button>
                    </div>
                    {(transcription || transcriptionError) && (
                        <div
                            className={classNames('voice-transcription', {
                                'voice-transcription-error': transcriptionError,
                            })}>
                            {transcriptionError || transcription}
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

VoiceNote.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    voiceNote: PropTypes.object.isRequired,
    openMedia: PropTypes.func,
};

export default withStyles(styles, { withTheme: true })(VoiceNote);
