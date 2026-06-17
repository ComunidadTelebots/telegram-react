import React, { Component } from 'react';
import CloseIcon from '@material-ui/icons/Close';
import SendIcon from '@material-ui/icons/Send';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { getFormattedText } from '../../Utils/Message';
import { getSrc } from '../../Utils/File';
import { getPhotoSize } from '../../Utils/Common';
import StoryStore from '../../Stores/StoryStore';
import ChatStore from '../../Stores/ChatStore';
import UserStore from '../../Stores/UserStore';
import FileStore from '../../Stores/FileStore';
import TdLibController from '../../Controllers/TdLibController';
import ChatTile from '../Tile/ChatTile';
import { getChatTitle } from '../../Utils/Chat';
import './StoryViewer.css';

const PHOTO_DURATION_MS = 6000;

function formatRelativeTime(timestamp) {
    if (!timestamp) return '';
    const diff = Math.floor(Date.now() / 1000) - timestamp;
    if (diff < 60) return 'ahora';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return `hace ${Math.floor(diff / 86400)}d`;
}

class StoryViewer extends Component {
    constructor(props) {
        super(props);
        const allPeers = StoryStore.getActivePeers();
        const peers = this._sortPeers(allPeers);

        const startPeerIdx = Math.max(
            0,
            peers.findIndex(p => p.sender_chat_id === props.chatId),
        );

        this.state = {
            peers,
            peerIdx: startPeerIdx,
            storyIdx: this._firstUnreadIdx(peers[startPeerIdx]),
            paused: false,
            mediaSrc: '',
            mediaLoaded: false,
            progressKey: 0,
            // reply
            replyText: '',
            showReply: false,
            // viewers panel
            showViewers: false,
            viewers: [],
            viewersTotal: 0,
            viewersLoading: false,
        };

        this._timer = null;
        this._videoRef = React.createRef();
        this._replyRef = React.createRef();
        this._touchStartX = null;
        this._touchStartY = null;
        this._touchStartTime = null;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    _sortPeers(peers) {
        const unread = peers.filter(p => this._peerHasUnread(p));
        const read = peers.filter(p => !this._peerHasUnread(p));
        const byOrder = (a, b) => (b.order || 0) - (a.order || 0);
        return [...unread.sort(byOrder), ...read.sort(byOrder)];
    }

    _peerHasUnread(peer) {
        return this._peerMaxStoryId(peer) > (peer.max_read_id || 0);
    }

    _peerMaxStoryId(peer) {
        let max = 0;
        for (const s of peer.stories?.values?.() || []) {
            if (s && s.id > max) max = s.id;
        }
        return max;
    }

    _peerStories(peer) {
        if (!peer?.stories) return [];
        return [...peer.stories.values()].filter(Boolean).sort((a, b) => a.id - b.id);
    }

    _firstUnreadIdx(peer) {
        const stories = this._peerStories(peer);
        const maxRead = peer?.max_read_id || 0;
        const idx = stories.findIndex(s => s.id > maxRead);
        return idx >= 0 ? idx : 0;
    }

    _currentPeer() {
        return this.state.peers[this.state.peerIdx] || null;
    }

    _currentStory() {
        const peer = this._currentPeer();
        if (!peer) return null;
        return this._peerStories(peer)[this.state.storyIdx] || null;
    }

    _storyDurationMs(story) {
        if (!story?.content) return PHOTO_DURATION_MS;
        if (story.content['@type'] === 'storyContentVideo') {
            const dur = story.content.video?.duration;
            return dur ? dur * 1000 : PHOTO_DURATION_MS;
        }
        return PHOTO_DURATION_MS;
    }

    _isOwnStory() {
        const peer = this._currentPeer();
        if (!peer) return false;
        const me = UserStore.getMyId ? UserStore.getMyId() : null;
        return me && peer.sender_chat_id === me;
    }

    // ── Lifecycle ────────────────────────────────────────────────────────────

    componentDidMount() {
        document.addEventListener('keydown', this._onKeyDown);
        StoryStore.on('updateStory', this._onStoreUpdate);
        StoryStore.on('updateReadStories', this._onStoreUpdate);
        FileStore.on('clientUpdatePhotoBlob', this._onFileUpdate);
        FileStore.on('updateFile', this._onFileUpdate);
        this._loadCurrentStory();
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this._onKeyDown);
        StoryStore.off('updateStory', this._onStoreUpdate);
        StoryStore.off('updateReadStories', this._onStoreUpdate);
        FileStore.off('clientUpdatePhotoBlob', this._onFileUpdate);
        FileStore.off('updateFile', this._onFileUpdate);
        this._clearTimer();
    }

    _onKeyDown = e => {
        if (e.key === 'Escape') {
            if (this.state.showViewers) {
                this.setState({ showViewers: false });
            } else if (this.state.showReply) {
                this._hideReply();
            } else {
                this.props.onClose();
            }
        }
        if (!this.state.showReply && !this.state.showViewers) {
            if (e.key === 'ArrowRight') this._advance(1);
            if (e.key === 'ArrowLeft') this._advance(-1);
        }
    };

    _onStoreUpdate = () => {
        this.setState({ peers: this._sortPeers(StoryStore.getActivePeers()) });
    };

    _onFileUpdate = () => {
        const src = this._resolveSrc();
        if (src && src !== this.state.mediaSrc) {
            this.setState({ mediaSrc: src });
        }
    };

    // ── Media loading ──────────────────────────────────────────────────────

    _resolveSrc() {
        const story = this._currentStory();
        if (!story?.content) return '';
        const { content } = story;
        if (content['@type'] === 'storyContentPhoto') {
            const photo = content.photo;
            if (!photo?.sizes) return '';
            const best = getPhotoSize(photo.sizes, 1280) || photo.sizes[photo.sizes.length - 1];
            return getSrc(best?.photo) || '';
        }
        if (content['@type'] === 'storyContentVideo') {
            return getSrc(content.video?.video) || '';
        }
        return '';
    }

    _triggerDownload(story) {
        if (!story?.content) return;
        const { content } = story;
        let file = null;
        if (content['@type'] === 'storyContentPhoto') {
            const photo = content.photo;
            if (!photo?.sizes) return;
            const best = getPhotoSize(photo.sizes, 1280) || photo.sizes[photo.sizes.length - 1];
            file = best?.photo;
        } else if (content['@type'] === 'storyContentVideo') {
            file = content.video?.video;
        }
        if (!file?.id) return;
        const resolved = FileStore.get(file.id) || file;
        if (FileStore.getBlob(resolved.id)) return;
        TdLibController.send({
            '@type': 'downloadFile',
            file_id: resolved.id,
            priority: 32,
            synchronous: false,
        }).catch(() => {});
    }

    _loadCurrentStory() {
        this._clearTimer();
        const story = this._currentStory();
        if (!story) return;

        const peer = this._currentPeer();
        if (!story.content && peer) {
            TdLibController.send({ '@type': 'getChatActiveStories', chat_id: peer.sender_chat_id })
                .then(result => {
                    if (result?.stories) {
                        for (const s of result.stories) {
                            if (s) peer.stories?.set(s.id, s);
                        }
                        this.forceUpdate(() => this._loadCurrentStory());
                    }
                })
                .catch(() => {});
            return;
        }

        this._triggerDownload(story);
        const src = this._resolveSrc();
        this.setState({ mediaSrc: src, mediaLoaded: false, progressKey: this.state.progressKey + 1 }, () => {
            if (src) this._startTimer(story);
        });

        if (peer && story.id > (peer.max_read_id || 0)) {
            TdLibController.send({
                '@type': 'readStories',
                chat_id: peer.sender_chat_id,
                max_story_id: story.id,
            }).catch(() => {});
        }
    }

    _startTimer(story) {
        this._clearTimer();
        if (this.state.paused || this.state.showReply || this.state.showViewers) return;
        const dur = this._storyDurationMs(story);
        this._timer = setTimeout(() => this._advance(1), dur);
    }

    _clearTimer() {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    }

    // ── Navigation ────────────────────────────────────────────────────────

    _advance(dir) {
        const { peerIdx, storyIdx, peers } = this.state;
        const peer = peers[peerIdx];
        if (!peer) return;
        const stories = this._peerStories(peer);
        const nextStoryIdx = storyIdx + dir;

        if (nextStoryIdx >= 0 && nextStoryIdx < stories.length) {
            this.setState({ storyIdx: nextStoryIdx, showReply: false, replyText: '' }, () => this._loadCurrentStory());
            return;
        }
        const nextPeerIdx = peerIdx + dir;
        if (nextPeerIdx >= 0 && nextPeerIdx < peers.length) {
            const nextStory = dir > 0 ? 0 : this._peerStories(peers[nextPeerIdx]).length - 1;
            this.setState(
                { peerIdx: nextPeerIdx, storyIdx: Math.max(0, nextStory), showReply: false, replyText: '' },
                () => this._loadCurrentStory(),
            );
            return;
        }
        if (dir > 0) this.props.onClose();
    }

    _setPaused(paused) {
        this.setState({ paused }, () => {
            if (paused) {
                this._clearTimer();
                const v = this._videoRef.current;
                if (v) v.pause();
            } else {
                const v = this._videoRef.current;
                if (v) v.play().catch(() => {});
                this._startTimer(this._currentStory());
            }
        });
    }

    // ── Reply ────────────────────────────────────────────────────────────

    _showReply = () => {
        this._clearTimer();
        this.setState({ showReply: true, paused: true }, () => {
            if (this._replyRef.current) this._replyRef.current.focus();
        });
    };

    _hideReply = () => {
        this.setState({ showReply: false, replyText: '', paused: false }, () => {
            this._startTimer(this._currentStory());
        });
    };

    _handleReplySend = async () => {
        const { replyText } = this.state;
        if (!replyText.trim()) return;
        const story = this._currentStory();
        const peer = this._currentPeer();
        if (!story || !peer) return;
        try {
            await TdLibController.send({
                '@type': 'sendMessage',
                chat_id: peer.sender_chat_id,
                input_message_content: {
                    '@type': 'inputMessageText',
                    text: { '@type': 'formattedText', text: replyText.trim(), entities: [] },
                },
                reply_to: {
                    '@type': 'inputMessageReplyToStory',
                    story_sender_chat_id: peer.sender_chat_id,
                    story_id: story.id,
                },
            });
        } catch (e) {
            console.warn('[StoryViewer] reply send error', e);
        }
        this._hideReply();
    };

    // ── Viewers ────────────────────────────────────────────────────────────

    _loadViewers = async () => {
        const story = this._currentStory();
        const peer = this._currentPeer();
        if (!story || !peer) return;
        this.setState({ showViewers: true, viewersLoading: true, viewers: [], viewersTotal: 0 });
        this._clearTimer();
        try {
            const result = await TdLibController.send({
                '@type': 'getStoryViewers',
                chat_id: peer.sender_chat_id,
                story_id: story.id,
                limit: 100,
            });
            this.setState({
                viewers: result.viewers || [],
                viewersTotal: result.total_count || 0,
                viewersLoading: false,
            });
        } catch (e) {
            this.setState({ viewersLoading: false });
        }
    };

    _closeViewers = () => {
        this.setState({ showViewers: false }, () => {
            this._startTimer(this._currentStory());
        });
    };

    // ── Touch / click handlers ────────────────────────────────────────────

    _onMediaClick = e => {
        if (this.state.showReply || this.state.showViewers) return;
        const w = e.currentTarget.offsetWidth;
        const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
        this._advance(x < w / 2 ? -1 : 1);
    };

    _onMediaPointerDown = () => {
        if (!this.state.showReply && !this.state.showViewers) this._setPaused(true);
    };

    _onMediaPointerUp = () => {
        if (!this.state.showReply && !this.state.showViewers) this._setPaused(false);
    };

    _onTouchStart = e => {
        const t = e.touches[0];
        this._touchStartX = t.clientX;
        this._touchStartY = t.clientY;
        this._touchStartTime = Date.now();
        if (!this.state.showReply && !this.state.showViewers) this._setPaused(true);
    };

    _onTouchEnd = e => {
        if (!this.state.showReply && !this.state.showViewers) this._setPaused(false);
        const t = e.changedTouches[0];
        const dx = t.clientX - (this._touchStartX || 0);
        const dy = t.clientY - (this._touchStartY || 0);
        const dt = Date.now() - (this._touchStartTime || 0);
        if (dy > 60 && Math.abs(dx) < 60 && dt < 400) {
            // swipe down → close
            this.props.onClose();
        } else if (dy < -60 && Math.abs(dx) < 60 && dt < 400) {
            // swipe up → reply
            if (!this.state.showReply) this._showReply();
        }
        this._touchStartX = this._touchStartY = this._touchStartTime = null;
    };

    _onBackdropClick = e => {
        if (e.target === e.currentTarget) this.props.onClose();
    };

    _onVideoLoaded = () => {
        this.setState({ mediaLoaded: true });
        this._startTimer(this._currentStory());
    };

    _onImgLoaded = () => {
        this.setState({ mediaLoaded: true });
        this._startTimer(this._currentStory());
    };

    // ── Render ────────────────────────────────────────────────────────────

    render() {
        const {
            peerIdx,
            storyIdx,
            peers,
            paused,
            mediaSrc,
            progressKey,
            showReply,
            replyText,
            showViewers,
            viewers,
            viewersTotal,
            viewersLoading,
        } = this.state;
        const peer = peers[peerIdx];
        if (!peer) return null;
        const stories = this._peerStories(peer);
        const story = stories[storyIdx];
        const chatId = peer.sender_chat_id;
        const chat = ChatStore.get(chatId);
        const title = chat ? getChatTitle(chat) : String(chatId);
        const durationMs = this._storyDurationMs(story);
        const isVideo = story?.content?.['@type'] === 'storyContentVideo';
        const caption = story?.caption;
        const isOwn = this._isOwnStory();

        return (
            <div className='story-viewer-backdrop' onClick={this._onBackdropClick}>
                <div className='story-viewer'>
                    {/* Progress segments */}
                    <div className='story-progress-bar'>
                        {stories.map((s, idx) => (
                            <div key={s.id} className='story-progress-segment'>
                                <div
                                    className={`story-progress-fill ${
                                        idx < storyIdx
                                            ? 'story-progress-fill--done'
                                            : idx === storyIdx
                                            ? 'story-progress-fill--active'
                                            : ''
                                    }`}
                                    key={idx === storyIdx ? progressKey : idx}
                                    style={
                                        idx === storyIdx && !paused
                                            ? { animationDuration: `${durationMs}ms` }
                                            : idx === storyIdx && paused
                                            ? { animationPlayState: 'paused' }
                                            : undefined
                                    }
                                />
                            </div>
                        ))}
                    </div>

                    {/* Header */}
                    <div className='story-header'>
                        <div className='story-header-left'>
                            <div className='story-header-avatar'>
                                <ChatTile chatId={chatId} showSavedMessages={false} />
                            </div>
                            <div className='story-header-info'>
                                <span className='story-header-name'>{title}</span>
                                <span className='story-header-time'>{formatRelativeTime(story?.date)}</span>
                            </div>
                        </div>
                        <div className='story-header-right'>
                            {isOwn && story && (
                                <button
                                    className='story-viewers-btn'
                                    onClick={this._loadViewers}
                                    title='Ver quién lo vio'>
                                    <VisibilityIcon style={{ fontSize: 18 }} />
                                    {story.view_count > 0 && (
                                        <span className='story-viewers-count'>{story.view_count}</span>
                                    )}
                                </button>
                            )}
                            <button className='story-close-btn' onClick={this.props.onClose}>
                                <CloseIcon />
                            </button>
                        </div>
                    </div>

                    {/* Media */}
                    <div
                        className='story-media-area'
                        onClick={this._onMediaClick}
                        onPointerDown={this._onMediaPointerDown}
                        onPointerUp={this._onMediaPointerUp}
                        onTouchStart={this._onTouchStart}
                        onTouchEnd={this._onTouchEnd}>
                        {mediaSrc && isVideo ? (
                            <video
                                ref={this._videoRef}
                                className='story-media-video'
                                src={mediaSrc}
                                autoPlay
                                muted={false}
                                playsInline
                                onLoadedData={this._onVideoLoaded}
                                onEnded={() => this._advance(1)}
                            />
                        ) : mediaSrc ? (
                            <img
                                className='story-media-img'
                                src={mediaSrc}
                                alt=''
                                draggable={false}
                                onLoad={this._onImgLoaded}
                            />
                        ) : (
                            <div className='story-media-loading' />
                        )}
                    </div>

                    {/* Caption */}
                    {caption?.text && <div className='story-caption'>{getFormattedText(caption) || caption.text}</div>}

                    {/* Reply bar */}
                    {!isOwn && (
                        <div className={`story-reply-bar${showReply ? ' story-reply-bar--open' : ''}`}>
                            {showReply ? (
                                <>
                                    <input
                                        ref={this._replyRef}
                                        className='story-reply-input'
                                        placeholder='Responder a la historia...'
                                        value={replyText}
                                        onChange={e => this.setState({ replyText: e.target.value })}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') this._handleReplySend();
                                            if (e.key === 'Escape') this._hideReply();
                                        }}
                                    />
                                    <button
                                        className='story-reply-send-btn'
                                        onClick={this._handleReplySend}
                                        disabled={!replyText.trim()}>
                                        <SendIcon style={{ fontSize: 18 }} />
                                    </button>
                                    <button className='story-reply-cancel-btn' onClick={this._hideReply}>
                                        ✕
                                    </button>
                                </>
                            ) : (
                                <button className='story-reply-hint' onClick={this._showReply}>
                                    Responder...
                                </button>
                            )}
                        </div>
                    )}

                    {/* Album strip — only when peer has 2+ stories */}
                    {stories.length > 1 && !showReply && !showViewers && (
                        <div className='story-album-strip'>
                            <span className='story-album-counter'>
                                {storyIdx + 1} / {stories.length}
                            </span>
                            <div className='story-album-dots'>
                                {stories.map((s, idx) => (
                                    <button
                                        key={s.id}
                                        className={`story-album-dot${
                                            idx === storyIdx ? ' story-album-dot--active' : ''
                                        }`}
                                        onClick={e => {
                                            e.stopPropagation();
                                            if (idx !== storyIdx)
                                                this.setState({ storyIdx: idx, showReply: false, replyText: '' }, () =>
                                                    this._loadCurrentStory(),
                                                );
                                        }}
                                        title={`Historia ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Viewers panel */}
                    {showViewers && (
                        <div className='story-viewers-panel'>
                            <div className='story-viewers-panel-header'>
                                <span className='story-viewers-panel-title'>
                                    Visto por {viewersTotal > 0 ? viewersTotal : ''}
                                </span>
                                <button className='story-viewers-close' onClick={this._closeViewers}>
                                    <CloseIcon style={{ fontSize: 18 }} />
                                </button>
                            </div>
                            <div className='story-viewers-list'>
                                {viewersLoading && <div className='story-viewers-loading'>Cargando...</div>}
                                {!viewersLoading && viewers.length === 0 && (
                                    <div className='story-viewers-empty'>Nadie ha visto esta historia aún.</div>
                                )}
                                {viewers.map((v, i) => {
                                    const user = UserStore.get(v.user_id);
                                    const name = user
                                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || String(v.user_id)
                                        : String(v.user_id);
                                    return (
                                        <div key={i} className='story-viewer-row'>
                                            <span className='story-viewer-name'>{name}</span>
                                            <span className='story-viewer-time'>{formatRelativeTime(v.date)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default StoryViewer;
