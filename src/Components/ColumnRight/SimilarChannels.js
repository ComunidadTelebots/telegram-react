import React, { Component } from 'react';
import ChatTile from '../Tile/ChatTile';
import TdLibController from '../../Controllers/TdLibController';
import './SimilarChannels.css';

class SimilarChannels extends Component {
    constructor(props) {
        super(props);
        this.state = { chats: [], loading: true };
    }

    componentDidMount() {
        this.load();
    }

    componentDidUpdate(prev) {
        if (prev.chatId !== this.props.chatId) this.load();
    }

    load = async () => {
        const { chatId } = this.props;
        this.setState({ loading: true, chats: [] });
        try {
            const result = await TdLibController.send({ '@type': 'getSimilarChannels', chat_id: chatId });
            this.setState({ chats: result.chats || [], loading: false });
        } catch {
            this.setState({ loading: false });
        }
    };

    render() {
        const { chats, loading } = this.state;
        if (loading || chats.length === 0) return null;

        return (
            <div className='similar-channels'>
                <div className='similar-channels-title'>Canales similares</div>
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
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}

export default SimilarChannels;
