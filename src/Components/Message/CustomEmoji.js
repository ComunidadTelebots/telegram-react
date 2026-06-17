import React from 'react';
import Lottie from '../Viewer/Lottie';
import { inflateBlob } from '../../Workers/BlobInflator';
import FileStore from '../../Stores/FileStore';
import TdLibController from '../../Controllers/TdLibController';
import './CustomEmoji.css';

const FILE_PRIORITY = 1;

// Shared cache: emojiId → sticker object (avoids duplicate API calls)
const stickerCache = new Map();

class CustomEmoji extends React.PureComponent {
    constructor(props) {
        super(props);
        this.lottieRef = React.createRef();
        this.spanRef = React.createRef();
        this.observer = null;
        this._fileHandler = null;
        this._mounted = false;
        // loading: false = not started, true = in progress
        // visible drives whether to load and play
        this.state = {
            visible: false,
            sticker: null,
            animationData: null,
            src: '',
            error: false,
        };
    }

    componentDidMount() {
        this._mounted = true;
        this._setupIntersectionObserver();
    }

    componentWillUnmount() {
        this._mounted = false;

        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        // Destroy Lottie instance to free memory
        const player = this.lottieRef.current;
        if (player && player.destroy) {
            player.destroy();
        }

        // Pause video
        if (this._videoRef) {
            this._videoRef.pause();
            this._videoRef.src = '';
        }

        // Remove FileStore listeners
        this._removeFileListener();
    }

    _setupIntersectionObserver() {
        if (!this.spanRef.current || typeof IntersectionObserver === 'undefined') return;
        this.observer = new IntersectionObserver(
            entries => {
                const isVisible = entries[0] && entries[0].isIntersecting;
                if (isVisible && !this.state.visible) {
                    // First time entering view: start load
                    this.setState({ visible: true }, () => this._startLoad());
                } else if (!isVisible && this.state.visible) {
                    // Out of view: pause animation/video only, keep data
                    this._setPlayback(false);
                } else if (isVisible && this.state.visible) {
                    // Back in view: resume
                    this._setPlayback(true);
                }
            },
            { threshold: 0, rootMargin: '100px' },
        );
        this.observer.observe(this.spanRef.current);
    }

    _setPlayback(playing) {
        const player = this.lottieRef.current;
        if (player) {
            try {
                playing ? player.play() : player.pause();
            } catch {}
        }
        if (this._videoRef) {
            if (playing) {
                this._videoRef.play().catch(() => {});
            } else {
                this._videoRef.pause();
            }
        }
    }

    async _startLoad() {
        const { emojiId } = this.props;
        if (!emojiId) {
            this._safeSetState({ error: true });
            return;
        }

        if (stickerCache.has(emojiId)) {
            const sticker = stickerCache.get(emojiId);
            this._safeSetState({ sticker }, () => this._loadFile(sticker));
            return;
        }

        try {
            const result = await TdLibController.send({
                '@type': 'getCustomEmojiDocuments',
                document_ids: [emojiId],
            });
            if (!this._mounted) return;
            const sticker = result && result.stickers && result.stickers[0];
            if (!sticker) {
                this._safeSetState({ error: true });
                return;
            }
            stickerCache.set(emojiId, sticker);
            this._safeSetState({ sticker }, () => this._loadFile(sticker));
        } catch {
            this._safeSetState({ error: true });
        }
    }

    _safeSetState(state, cb) {
        if (this._mounted) this.setState(state, cb);
    }

    _removeFileListener() {
        if (this._fileHandler) {
            FileStore.removeListener('clientUpdateUserBlobs', this._fileHandler);
            FileStore.removeListener('updateFile', this._fileHandler);
            this._fileHandler = null;
        }
    }

    _loadFile(sticker) {
        if (!sticker || !sticker.sticker) return;
        const file = FileStore.get(sticker.sticker.id) || sticker.sticker;
        const { id } = file;

        const existingBlob = FileStore.getBlob(id);
        if (existingBlob) {
            this._onFileReady(sticker, existingBlob);
            return;
        }

        this._fileHandler = update => {
            const updatedId = update.file ? update.file.id : update.id || null;
            if (updatedId !== id) return;
            const blob = FileStore.getBlob(id);
            if (!blob) return;
            this._removeFileListener();
            this._onFileReady(sticker, blob);
        };
        FileStore.on('clientUpdateUserBlobs', this._fileHandler);
        FileStore.on('updateFile', this._fileHandler);

        FileStore.getLocalFile(
            FileStore,
            file,
            null,
            () => {},
            () => FileStore.getRemoteFile(id, FILE_PRIORITY, sticker),
        );
    }

    async _onFileReady(sticker, blob) {
        if (!this._mounted) return;
        if (sticker.is_animated) {
            try {
                const result = await inflateBlob(blob);
                if (!result || !this._mounted) return;
                const animationData = JSON.parse(result);
                this._safeSetState({ animationData });
            } catch {
                this._safeSetState({ error: true });
            }
        } else {
            const url = FileStore.getBlobUrl(blob);
            this._safeSetState({ src: url });
        }
    }

    render() {
        const { fallback } = this.props;
        const { visible, sticker, animationData, src, error } = this.state;

        // Not yet visible, or failed to load → render fallback text only
        if (!visible || error || !sticker) {
            return (
                <span ref={this.spanRef} className='custom-emoji custom-emoji-fallback'>
                    {fallback}
                </span>
            );
        }

        const { is_animated, is_video } = sticker;

        if (is_animated) {
            if (!animationData) {
                return (
                    <span ref={this.spanRef} className='custom-emoji custom-emoji-fallback'>
                        {fallback}
                    </span>
                );
            }
            return (
                <span ref={this.spanRef} className='custom-emoji'>
                    <Lottie
                        ref={this.lottieRef}
                        options={{
                            autoplay: true,
                            loop: true,
                            animationData,
                            renderer: 'svg',
                            rendererSettings: {
                                preserveAspectRatio: 'xMidYMid meet',
                                clearCanvas: false,
                                progressiveLoad: true,
                                hideOnTransparent: true,
                                className: 'custom-emoji-lottie',
                            },
                        }}
                    />
                </span>
            );
        }

        if (is_video) {
            if (!src) {
                return (
                    <span ref={this.spanRef} className='custom-emoji custom-emoji-fallback'>
                        {fallback}
                    </span>
                );
            }
            return (
                <span ref={this.spanRef} className='custom-emoji'>
                    <video
                        ref={el => {
                            this._videoRef = el;
                        }}
                        className='custom-emoji-video'
                        src={src}
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                </span>
            );
        }

        // Static image
        if (!src) {
            return (
                <span ref={this.spanRef} className='custom-emoji custom-emoji-fallback'>
                    {fallback}
                </span>
            );
        }
        return (
            <span ref={this.spanRef} className='custom-emoji'>
                <img className='custom-emoji-img' src={src} alt={fallback} draggable={false} />
            </span>
        );
    }
}

export default CustomEmoji;
