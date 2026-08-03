import React, { Component } from 'react';
import ChatTile from '../Tile/ChatTile';
import TdLibController from '../../Controllers/TdLibController';
import './SimilarChannels.css';

class SimilarChannels extends Component {
    constructor(props) {
        super(props);
        this.state = { chats: [], loading: true, joiningId: null, joinedIds: [], error: '' };
    }

    componentDidMount() {
        this.load();
    }

    componentDidUpdate(prev) {
        if (prev.chatId !== this.props.chatId) this.load();
    }

    load = async () => {
        const { chatId } = this.props;
        this.setState({ loading: true, chats: [], error: '' });
        try {
            const result = await TdLibController.send({ '@type': 'getSimilarChannels', chat_id: chatId });
            this.setState({ chats: result.chats || [], loading: false });
        } catch (error) {
            this.setState({ loading: false, error: error.message || 'No se pudieron cargar las recomendaciones.' });
        }
    };

    join = async (chatId, event) => {
        event.stopPropagation();
        this.setState({ joiningId: chatId, error: '' });
        try {
            await TdLibController.send({ '@type': 'joinChat', chat_id: chatId });
            this.setState(state => ({ joiningId: null, joinedIds: state.joinedIds.concat(chatId) }));
        } catch (error) {
            this.setState({ joiningId: null, error: error.message || 'No se pudo unir al canal.' });
        }
    };

    render() {
        const { chats, loading, joiningId, joinedIds, error } = this.state;
        if (loading || (chats.length === 0 && !error)) return null;

        return (
            <div className='similar-channels'>
                <div className='similar-channels-title'>Canales similares</div>
                {error && <div className='similar-channels-error'>{error}</div>}
                <div className='similar-channels-list'>
                    {chats.map(chat => (
                        <div
                            key={chat.id}
                            className='similar-channel-item'
                            onClick={() =>
                                TdLibController.clientUpdate({ '@type': 'clientUpdateChatId', nextChatId: chat.id })
                            }>
                            <ChatTile chatId={chat.id} showOnline={false} />
                            <div className='similar-channel-info'>
                                <div className='similar-channel-title'>{chat.title}</div>
                                {chat.member_count > 0 && (
                                    <div className='similar-channel-members'>
                                        {chat.member_count.toLocaleString()} miembros
                                    </div>
                                )}
                            </div>
                            <button
                                type='button'
                                className='similar-channel-join'
                                disabled={joiningId === chat.id || joinedIds.includes(chat.id)}
                                onClick={event => this.join(chat.id, event)}>
                                {joinedIds.includes(chat.id)
                                    ? 'Unido'
                                    : joiningId === chat.id
                                    ? 'Uniendo...'
                                    : 'Unirme'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}

export default SimilarChannels;
