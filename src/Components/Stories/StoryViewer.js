import React, { Component } from 'react';
import CloseIcon from '@material-ui/icons/Close';
import { getFormattedText } from '../../Utils/Message';
import { getSrc } from '../../Utils/File';
import { getPhotoSize, getSize } from '../../Utils/Common';
import StoryStore from '../../Stores/StoryStore';
import ChatStore from '../../Stores/ChatStore';
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
        // Build ordered peers list (unread first)
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
            // media resolved from FileStore
            mediaSrc: '',
            mediaLoaded: false,
            progressKey: 0, // increment to restart CSS animation
        };

        this._timer = null;
        this._videoRef = React.createRef();
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
        const maxId = this._peerMaxStoryId(peer);
        return maxId > (peer.max_read_id || 0);
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
        const stories = this._peerStories(peer);
        return stories[this.state.storyIdx] || null;
    }

    _storyDurationMs(story) {
        if (!story?.content) return PHOTO_DURATION_MS;
        if (story.content['@type'] === 'storyContentVideo') {
            const dur = story.content.video?.duration;
            return dur ? dur * 1000 : PHOTO_DURATION_MS;
        }
        return PHOTO_DURATION_MS;
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
        if (e.key === 'Escape') this.props.onClose();
        if (e.key === 'ArrowRight') this._advance(1);
        if (e.key === 'ArrowLeft') this._advance(-1);
    };

    _onStoreUpdate = () => {
        const peers = this._sortPeers(StoryStore.getActivePeers());
        this.setState({ peers });
    };

    _onFileUpdate = () => {
        // Re-resolve src in case a blob just arrived
        const src = this._resolveSrc();
        if (src && src !== this.state.mediaSrc) {
            this.setState({ mediaSrc: src });
        }
    };

    // ── Media loading ─────────────────────────────────────────────────────────

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
            const file = content.video?.video;
            return getSrc(file) || '';
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
        if (FileStore.getBlob(resolved.id)) return; // already downloaded
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

        // Fetch from server if not in StoryStore yet
        const peer = this._currentPeer();
        if (!story.content && peer) {
            TdLibController.send({
                '@type': 'getChatActiveStories',
                chat_id: peer.sender_chat_id,
            })
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

        // Mark as read
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
        if (this.state.paused) return;
        const dur = this._storyDurationMs(story);
        this._timer = setTimeout(() => this._advance(1), dur);
    }

    _clearTimer() {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    }

    // ── Navigation ────────────────────────────────────────────────────────────

    _advance(dir) {
        const { peerIdx, storyIdx, peers } = this.state;
        const peer = peers[peerIdx];
        if (!peer) return;
        const stories = this._peerStories(peer);
        const nextStoryIdx = storyIdx + dir;

        if (nextStoryIdx >= 0 && nextStoryIdx < stories.length) {
            this.setState({ storyIdx: nextStoryIdx }, () => this._loadCurrentStory());
            return;
        }
        // Move to next/previous peer
        const nextPeerIdx = peerIdx + dir;
        if (nextPeerIdx >= 0 && nextPeerIdx < peers.length) {
            const nextStory = dir > 0 ? 0 : this._peerStories(peers[nextPeerIdx]).length - 1;
            this.setState({ peerIdx: nextPeerIdx, storyIdx: Math.max(0, nextStory) }, () => this._loadCurrentStory());
            return;
        }
        // End of all stories
        if (dir > 0) this.props.onClose();
        else if (peerIdx === 0 && storyIdx === 0) {
            /* already first */
        }
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

    // ── Touch / click handlers ────────────────────────────────────────────────

    _onMediaClick = e => {
        const w = e.currentTarget.offsetWidth;
        const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
        this._advance(x < w / 2 ? -1 : 1);
    };

    _onMediaPointerDown = () => this._setPaused(true);
    _onMediaPointerUp = () => this._setPaused(false);

    _onTouchStart = e => {
        const t = e.touches[0];
        this._touchStartX = t.clientX;
        this._touchStartY = t.clientY;
        this._touchStartTime = Date.now();
        this._setPaused(true);
    };

    _onTouchEnd = e => {
        this._setPaused(false);
        const t = e.changedTouches[0];
        const dx = t.clientX - (this._touchStartX || 0);
        const dy = t.clientY - (this._touchStartY || 0);
        const dt = Date.now() - (this._touchStartTime || 0);
        // Swipe down to close
        if (dy > 60 && Math.abs(dx) < 60 && dt < 400) {
            this.props.onClose();
        }
        this._touchStartX = this._touchStartY = this._touchStartTime = null;
    };

    _onBackdropClick = e => {
        if (e.target === e.currentTarget) this.props.onClose();
    };

    _onVideoLoaded = () => {
        this.setState({ mediaLoaded: true });
        const story = this._currentStory();
        if (story) this._startTimer(story);
    };

    _onImgLoaded = () => {
        this.setState({ mediaLoaded: true });
        const story = this._currentStory();
        if (story) this._startTimer(story);
    };

    // ── Render ────────────────────────────────────────────────────────────────

    render() {
        const { peerIdx, storyIdx, peers, paused, mediaSrc, progressKey } = this.state;
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
                        <button className='story-close-btn' onClick={this.props.onClose}>
                            <CloseIcon />
                        </button>
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
                </div>
            </div>
        );
    }
}

export default StoryViewer;
