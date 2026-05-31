import React, { Component } from 'react';
import ChatTile from '../Tile/ChatTile';
import StoryStore from '../../Stores/StoryStore';
import ChatStore from '../../Stores/ChatStore';
import TdLibController from '../../Controllers/TdLibController';
import { getChatTitle } from '../../Utils/Chat';
import './StoriesTray.css';

export function openStoryViewer(chatId) {
    TdLibController.clientUpdate({ '@type': 'clientUpdateOpenStoryViewer', chatId });
}

class StoriesTray extends Component {
    constructor(props) {
        super(props);
        this.state = {
            peers: this._getSortedPeers(),
        };
    }

    _getSortedPeers() {
        const all = StoryStore.getActivePeers();
        const unread = all.filter(p => this._hasUnread(p));
        const read = all.filter(p => !this._hasUnread(p));
        // sin leer primero, luego por order desc dentro de cada grupo
        unread.sort((a, b) => (b.order || 0) - (a.order || 0));
        read.sort((a, b) => (b.order || 0) - (a.order || 0));
        return [...unread, ...read];
    }

    _hasUnread(peer) {
        const last = [...(peer.stories?.values?.() || [])].reduce((max, s) => (s && s.id > max ? s.id : max), 0);
        return last > (peer.max_read_id || 0);
    }

    componentDidMount() {
        StoryStore.on('updateStory', this._refresh);
        StoryStore.on('updateStoryDeleted', this._refresh);
        StoryStore.on('updateReadStories', this._refresh);
        StoryStore.on('updateActiveStories', this._refresh);
    }

    componentWillUnmount() {
        StoryStore.off('updateStory', this._refresh);
        StoryStore.off('updateStoryDeleted', this._refresh);
        StoryStore.off('updateReadStories', this._refresh);
        StoryStore.off('updateActiveStories', this._refresh);
    }

    _refresh = () => {
        this.setState({ peers: this._getSortedPeers() });
    };

    render() {
        const { peers } = this.state;
        if (!peers || peers.length === 0) return null;

        return (
            <div className='stories-tray'>
                <div className='stories-tray-inner'>
                    {peers.map(peer => {
                        const { sender_chat_id } = peer;
                        const hasUnread = this._hasUnread(peer);
                        const chat = ChatStore.get(sender_chat_id);
                        const title = chat ? getChatTitle(chat) : String(sender_chat_id);

                        return (
                            <button
                                key={sender_chat_id}
                                className='stories-tray-item'
                                onClick={() => openStoryViewer(sender_chat_id)}>
                                <div
                                    className={`stories-tray-ring ${
                                        hasUnread ? 'stories-tray-ring--unread' : 'stories-tray-ring--read'
                                    }`}>
                                    <div className='stories-tray-avatar-wrap'>
                                        <ChatTile chatId={sender_chat_id} showSavedMessages={false} />
                                    </div>
                                </div>
                                <span className='stories-tray-name'>{title}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }
}

export default StoriesTray;
