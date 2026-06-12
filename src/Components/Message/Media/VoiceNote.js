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
            transcriptionId: '',
            transcriptionError: '',
            transcriptionRated: null,
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
            transcriptionId: update.transcription_id || '',
            transcriptionError: '',
            transcriptionRated: null,
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
                transcriptionId: result.transcription_id || '',
                transcriptionError: '',
                transcriptionRated: null,
            });
        } catch (error) {
            this.setState({
                transcribing: false,
                transcriptionError: error.message || 'Transcription failed',
            });
        }
    };

    handleRateTranscription = async (event, isGood) => {
        event.stopPropagation();

        const { chatId, messageId } = this.props;
        const { transcriptionId } = this.state;
        if (!transcriptionId) return;

        await TdLibController.send({
            '@type': 'rateTranscribedAudio',
            chat_id: chatId,
            message_id: messageId,
            transcription_id: transcriptionId,
            is_good: isGood,
        });
        this.setState({ transcriptionRated: isGood });
    };

    render() {
        const { chatId, messageId, voiceNote, openMedia, classes } = this.props;
        const { transcribing, transcription, transcriptionId, transcriptionError, transcriptionRated } = this.state;
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
                            {transcription && transcriptionId && !transcriptionError && (
                                <span className='voice-transcription-rating'>
                                    <button
                                        className={classNames('voice-transcription-rate-btn', {
                                            'voice-transcription-rate-selected': transcriptionRated === true,
                                        })}
                                        onClick={event => this.handleRateTranscription(event, true)}
                                        title='La transcripcion es correcta'>
                                        ✓
                                    </button>
                                    <button
                                        className={classNames('voice-transcription-rate-btn', {
                                            'voice-transcription-rate-selected': transcriptionRated === false,
                                        })}
                                        onClick={event => this.handleRateTranscription(event, false)}
                                        title='La transcripcion necesita mejora'>
                                        ✕
                                    </button>
                                </span>
                            )}
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
