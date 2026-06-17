import React, { Component, createRef } from 'react';
import CloseIcon from '@material-ui/icons/Close';
import PhotoCameraIcon from '@material-ui/icons/PhotoCamera';
import SendIcon from '@material-ui/icons/Send';
import TdLibController from '../../Controllers/TdLibController';
import './StoryComposer.css';

const PRIVACY_OPTIONS = [
    { value: 'everyone', label: 'Todos' },
    { value: 'contacts', label: 'Contactos' },
    { value: 'close_friends', label: 'Amigos cercanos' },
];

const PERIOD_OPTIONS = [
    { value: 21600, label: '6 horas' },
    { value: 43200, label: '12 horas' },
    { value: 86400, label: '24 horas' },
    { value: 172800, label: '48 horas' },
];

class StoryComposer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            file: null,
            previewSrc: '',
            caption: '',
            privacy: 'everyone',
            period: 86400,
            sending: false,
            error: '',
        };
        this._fileRef = createRef();
    }

    _onFileChange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const isPhoto = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        if (!isPhoto && !isVideo) {
            this.setState({ error: 'Solo se admiten imágenes o vídeos.' });
            return;
        }
        const previewSrc = URL.createObjectURL(file);
        this.setState({ file, previewSrc, error: '' });
    };

    _onSend = async () => {
        const { file, caption, privacy, period } = this.state;
        if (!file) {
            this.setState({ error: 'Selecciona una foto o vídeo.' });
            return;
        }
        this.setState({ sending: true, error: '' });
        try {
            await TdLibController.send({ '@type': 'sendStory', file, caption, privacy, period });
            this.props.onClose();
        } catch (e) {
            console.error('[StoryComposer] send error', e);
            this.setState({ sending: false, error: e.message || 'Error al publicar.' });
        }
    };

    _onBackdropClick = e => {
        if (e.target === e.currentTarget) this.props.onClose();
    };

    componentWillUnmount() {
        if (this.state.previewSrc) URL.revokeObjectURL(this.state.previewSrc);
    }

    render() {
        const { file, previewSrc, caption, privacy, period, sending, error } = this.state;
        const isVideo = file?.type?.startsWith('video/');

        return (
            <div className='story-composer-backdrop' onClick={this._onBackdropClick}>
                <div className='story-composer'>
                    {/* Header */}
                    <div className='story-composer-header'>
                        <span className='story-composer-title'>Nueva historia</span>
                        <button className='story-composer-close' onClick={this.props.onClose} disabled={sending}>
                            <CloseIcon />
                        </button>
                    </div>

                    {/* Preview area */}
                    <div className='story-composer-preview' onClick={() => !file && this._fileRef.current?.click()}>
                        {previewSrc && isVideo ? (
                            <video className='story-composer-media' src={previewSrc} autoPlay loop muted playsInline />
                        ) : previewSrc ? (
                            <img className='story-composer-media' src={previewSrc} alt='' />
                        ) : (
                            <div className='story-composer-placeholder'>
                                <PhotoCameraIcon className='story-composer-placeholder-icon' />
                                <span>Toca para añadir foto o vídeo</span>
                            </div>
                        )}
                    </div>

                    {/* Change media button if already selected */}
                    {file && (
                        <button
                            className='story-composer-change-media'
                            onClick={() => this._fileRef.current?.click()}
                            disabled={sending}>
                            Cambiar media
                        </button>
                    )}

                    <input
                        ref={this._fileRef}
                        type='file'
                        accept='image/*,video/*'
                        style={{ display: 'none' }}
                        onChange={this._onFileChange}
                    />

                    {/* Caption */}
                    <div className='story-composer-field'>
                        <textarea
                            className='story-composer-caption'
                            placeholder='Añade un texto a tu historia...'
                            value={caption}
                            maxLength={2048}
                            rows={3}
                            onChange={e => this.setState({ caption: e.target.value })}
                            disabled={sending}
                        />
                    </div>

                    {/* Privacy */}
                    <div className='story-composer-field'>
                        <label className='story-composer-label'>Privacidad</label>
                        <div className='story-composer-options'>
                            {PRIVACY_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    className={`story-composer-option${
                                        privacy === opt.value ? ' story-composer-option--active' : ''
                                    }`}
                                    onClick={() => this.setState({ privacy: opt.value })}
                                    disabled={sending}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Period */}
                    <div className='story-composer-field'>
                        <label className='story-composer-label'>Duración</label>
                        <div className='story-composer-options'>
                            {PERIOD_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    className={`story-composer-option${
                                        period === opt.value ? ' story-composer-option--active' : ''
                                    }`}
                                    onClick={() => this.setState({ period: opt.value })}
                                    disabled={sending}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <div className='story-composer-error'>{error}</div>}

                    {/* Send */}
                    <button className='story-composer-send' onClick={this._onSend} disabled={sending || !file}>
                        {sending ? (
                            <span className='story-composer-sending'>Publicando...</span>
                        ) : (
                            <>
                                <SendIcon style={{ fontSize: 18, marginRight: 6 }} />
                                Publicar historia
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }
}

export default StoryComposer;
