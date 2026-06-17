import React, { Component } from 'react';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import AddIcon from '@material-ui/icons/Add';
import LockIcon from '@material-ui/icons/Lock';
import PushPinIcon from '@material-ui/icons/PushPin';
import CircularProgress from '@material-ui/core/CircularProgress';
import TdLibController from '../../Controllers/TdLibController';
import ChatStore from '../../Stores/ChatStore';
import { getChatTitle } from '../../Utils/Chat';
import './TopicsList.css';

const TOPIC_COLORS = ['#6fb9f0', '#ffd67e', '#cb86db', '#8dd6c9', '#f7ae8e', '#ff9fd7', '#73ad5f'];

function topicColor(iconColor) {
    const idx = TOPIC_COLORS.indexOf('#' + iconColor?.toString(16).padStart(6, '0'));
    return TOPIC_COLORS[idx >= 0 ? idx : Math.abs(iconColor || 0) % TOPIC_COLORS.length] || TOPIC_COLORS[0];
}

class CreateTopicModal extends Component {
    constructor(props) {
        super(props);
        this.state = { title: '', sending: false, error: '' };
    }

    _onSubmit = async e => {
        e.preventDefault();
        const { title } = this.state;
        if (!title.trim()) return;
        this.setState({ sending: true, error: '' });
        try {
            await TdLibController.send({
                '@type': 'createForumTopic',
                chat_id: this.props.chatId,
                title: title.trim(),
            });
            this.props.onCreated();
        } catch (err) {
            this.setState({ sending: false, error: err.message || 'Error al crear tema.' });
        }
    };

    render() {
        const { onClose } = this.props;
        const { title, sending, error } = this.state;
        return (
            <div className='topics-modal-backdrop' onClick={e => e.target === e.currentTarget && onClose()}>
                <div className='topics-modal'>
                    <div className='topics-modal-header'>
                        <span className='topics-modal-title'>Nuevo tema</span>
                        <button className='topics-modal-close' onClick={onClose} disabled={sending}>
                            ✕
                        </button>
                    </div>
                    <form className='topics-modal-body' onSubmit={this._onSubmit}>
                        <input
                            className='topics-modal-input'
                            placeholder='Título del tema'
                            value={title}
                            maxLength={128}
                            autoFocus
                            disabled={sending}
                            onChange={e => this.setState({ title: e.target.value })}
                        />
                        {error && <div className='topics-modal-error'>{error}</div>}
                        <button className='topics-modal-submit' type='submit' disabled={sending || !title.trim()}>
                            {sending ? 'Creando...' : 'Crear'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }
}

class TopicsList extends Component {
    constructor(props) {
        super(props);
        this.state = { topics: [], loading: true, error: '', showCreate: false };
    }

    componentDidMount() {
        this._loadTopics();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.chatId !== this.props.chatId) {
            this.setState({ topics: [], loading: true, error: '' });
            this._loadTopics();
        }
    }

    _loadTopics = async () => {
        const { chatId } = this.props;
        try {
            const result = await TdLibController.send({ '@type': 'getForumTopics', chat_id: chatId, limit: 100 });
            this.setState({ topics: result.topics || [], loading: false });
        } catch (err) {
            this.setState({ loading: false, error: err.message || 'Error al cargar temas.' });
        }
    };

    _openTopic = topic => {
        const { chatId } = this.props;
        TdLibController.clientUpdate({
            '@type': 'clientUpdateOpenForumTopic',
            chatId,
            topicId: topic.id,
            title: topic.title,
        });
    };

    render() {
        const { chatId, onClose } = this.props;
        const { topics, loading, error, showCreate } = this.state;
        const chat = ChatStore.get(chatId);
        const chatTitle = chat ? getChatTitle(chat) : String(chatId);

        return (
            <div className='topics-list'>
                <div className='topics-list-header'>
                    <button className='topics-list-back' onClick={onClose} title='Volver'>
                        <ArrowBackIcon />
                    </button>
                    <span className='topics-list-title'>{chatTitle}</span>
                    <button
                        className='topics-list-add'
                        title='Nuevo tema'
                        onClick={() => this.setState({ showCreate: true })}>
                        <AddIcon />
                    </button>
                </div>

                <div className='topics-list-body'>
                    {loading && (
                        <div className='topics-list-loading'>
                            <CircularProgress size={28} />
                        </div>
                    )}
                    {error && <div className='topics-list-error'>{error}</div>}
                    {!loading &&
                        !error &&
                        topics.map(topic => (
                            <button key={topic.id} className='topic-item' onClick={() => this._openTopic(topic)}>
                                <div className='topic-item-icon' style={{ background: topicColor(topic.icon_color) }}>
                                    <span className='topic-item-hash'>#</span>
                                </div>
                                <div className='topic-item-info'>
                                    <div className='topic-item-row'>
                                        <span className='topic-item-title'>{topic.title}</span>
                                        <span className='topic-item-badges'>
                                            {topic.is_pinned && (
                                                <PushPinIcon className='topic-item-badge-icon topic-item-pin' />
                                            )}
                                            {topic.is_closed && (
                                                <LockIcon className='topic-item-badge-icon topic-item-lock' />
                                            )}
                                        </span>
                                    </div>
                                    {topic.unread_count > 0 && (
                                        <span className='topic-item-unread'>{topic.unread_count}</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    {!loading && !error && topics.length === 0 && (
                        <div className='topics-list-empty'>No hay temas aún.</div>
                    )}
                </div>

                {showCreate && (
                    <CreateTopicModal
                        chatId={chatId}
                        onClose={() => this.setState({ showCreate: false })}
                        onCreated={() => {
                            this.setState({ showCreate: false });
                            this._loadTopics();
                        }}
                    />
                )}
            </div>
        );
    }
}

export default TopicsList;
