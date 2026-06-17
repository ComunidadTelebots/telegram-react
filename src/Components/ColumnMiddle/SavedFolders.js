import React, { Component } from 'react';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import PushPinIcon from '@material-ui/icons/Bookmark';
import CircularProgress from '@material-ui/core/CircularProgress';
import ChatTile from '../Tile/ChatTile';
import TdLibController from '../../Controllers/TdLibController';
import ChatStore from '../../Stores/ChatStore';
import UserStore from '../../Stores/UserStore';
import { getChatTitle } from '../../Utils/Chat';
import { getUserFullName } from '../../Utils/User';
import './SavedFolders.css';

function peerLabel(peer) {
    if (!peer) return '?';
    if (peer['@type'] === 'peerUser' || peer.user_id) {
        const user = UserStore.get(peer.user_id);
        return user ? getUserFullName(user) : String(peer.user_id);
    }
    if (peer['@type'] === 'peerChat' || peer.chat_id) {
        const chat = ChatStore.get(peer.chat_id);
        return chat ? getChatTitle(chat) : String(peer.chat_id);
    }
    if (peer['@type'] === 'peerChannel' || peer.channel_id) {
        const chat = ChatStore.get(-1000000000000 - Number(peer.channel_id));
        return chat ? getChatTitle(chat) : String(peer.channel_id);
    }
    return '?';
}

function peerChatId(peer) {
    if (!peer) return null;
    if (peer.user_id) return Number(peer.user_id);
    if (peer.chat_id) return -Number(peer.chat_id);
    if (peer.channel_id) return -1000000000000 - Number(peer.channel_id);
    return null;
}

class SavedFolderMessages extends Component {
    constructor(props) {
        super(props);
        this.state = { messages: [], loading: true, error: '' };
    }

    componentDidMount() {
        this._load();
    }

    _load = async () => {
        const { savedPeer } = this.props;
        try {
            const result = await TdLibController.send({
                '@type': 'getSavedHistory',
                peer: savedPeer,
                limit: 30,
                offset_id: 0,
                offset_date: 0,
            });
            this.setState({ messages: result.messages || [], loading: false });
        } catch (err) {
            this.setState({ loading: false, error: err.message || 'Error al cargar mensajes.' });
        }
    };

    render() {
        const { savedPeer, onBack } = this.props;
        const { messages, loading, error } = this.state;
        const label = peerLabel(savedPeer);

        return (
            <div className='saved-folder-msgs'>
                <div className='saved-folder-msgs-header'>
                    <button className='saved-folder-back' onClick={onBack}>
                        <ArrowBackIcon />
                    </button>
                    <span className='saved-folder-msgs-title'>{label}</span>
                </div>
                <div className='saved-folder-msgs-body'>
                    {loading && (
                        <div className='saved-folder-loading'>
                            <CircularProgress size={26} />
                        </div>
                    )}
                    {error && <div className='saved-folder-error'>{error}</div>}
                    {!loading &&
                        !error &&
                        messages.map((msg, idx) => (
                            <div key={msg.id || idx} className='saved-msg-row'>
                                <div className='saved-msg-text'>
                                    {msg.content?.text?.text ||
                                        msg.content?.caption?.text ||
                                        `[${msg.content?.['@type'] || 'mensaje'}]`}
                                </div>
                                {msg.date && (
                                    <div className='saved-msg-date'>{new Date(msg.date * 1000).toLocaleString()}</div>
                                )}
                            </div>
                        ))}
                    {!loading && !error && messages.length === 0 && (
                        <div className='saved-folder-empty'>No hay mensajes guardados aquí.</div>
                    )}
                </div>
            </div>
        );
    }
}

class SavedFolders extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dialogs: [],
            pinned: [],
            loading: true,
            error: '',
            activeTab: 'all',
            openPeer: null,
        };
    }

    componentDidMount() {
        this._load();
    }

    _load = async () => {
        try {
            const [allResult, pinnedResult] = await Promise.all([
                TdLibController.send({ '@type': 'getSavedDialogs', limit: 100, offset_id: 0, offset_date: 0 }),
                TdLibController.send({ '@type': 'getPinnedSavedDialogs' }),
            ]);
            this.setState({
                dialogs: allResult.dialogs || [],
                pinned: pinnedResult.dialogs || [],
                loading: false,
            });
        } catch (err) {
            this.setState({ loading: false, error: err.message || 'Error al cargar carpetas.' });
        }
    };

    render() {
        const { onClose } = this.props;
        const { dialogs, pinned, loading, error, activeTab, openPeer } = this.state;

        if (openPeer) {
            return <SavedFolderMessages savedPeer={openPeer} onBack={() => this.setState({ openPeer: null })} />;
        }

        const list = activeTab === 'pinned' ? pinned : dialogs;

        return (
            <div className='saved-folders'>
                <div className='saved-folders-header'>
                    <button className='saved-folders-back' onClick={onClose}>
                        <ArrowBackIcon />
                    </button>
                    <span className='saved-folders-title'>Mensajes guardados</span>
                </div>

                <div className='saved-folders-tabs'>
                    <button
                        className={`saved-tab${activeTab === 'all' ? ' saved-tab--active' : ''}`}
                        onClick={() => this.setState({ activeTab: 'all' })}>
                        Todos
                    </button>
                    <button
                        className={`saved-tab${activeTab === 'pinned' ? ' saved-tab--active' : ''}`}
                        onClick={() => this.setState({ activeTab: 'pinned' })}>
                        <PushPinIcon style={{ fontSize: 14, marginRight: 4 }} />
                        Fijados
                    </button>
                </div>

                <div className='saved-folders-body'>
                    {loading && (
                        <div className='saved-folder-loading'>
                            <CircularProgress size={26} />
                        </div>
                    )}
                    {error && <div className='saved-folder-error'>{error}</div>}
                    {!loading &&
                        !error &&
                        list.map((dialog, idx) => {
                            const peer = dialog.peer;
                            const chatId = peerChatId(peer);
                            const label = peerLabel(peer);
                            return (
                                <button
                                    key={idx}
                                    className='saved-folder-row'
                                    onClick={() => this.setState({ openPeer: peer })}>
                                    <div className='saved-folder-avatar'>
                                        {chatId ? (
                                            <ChatTile chatId={chatId} showSavedMessages={false} />
                                        ) : (
                                            <div className='saved-folder-avatar-fallback'>?</div>
                                        )}
                                    </div>
                                    <div className='saved-folder-info'>
                                        <span className='saved-folder-name'>{label}</span>
                                        {dialog.topMessage && (
                                            <span className='saved-folder-preview'>
                                                {dialog.topMessage.content?.text?.text ||
                                                    dialog.topMessage.content?.caption?.text ||
                                                    `[${dialog.topMessage.content?.['@type'] || 'mensaje'}]`}
                                            </span>
                                        )}
                                    </div>
                                    {dialog.isPinned && <PushPinIcon className='saved-folder-pin-icon' />}
                                </button>
                            );
                        })}
                    {!loading && !error && list.length === 0 && (
                        <div className='saved-folder-empty'>
                            {activeTab === 'pinned'
                                ? 'No hay diálogos fijados.'
                                : 'No hay mensajes guardados por remitente.'}
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default SavedFolders;
