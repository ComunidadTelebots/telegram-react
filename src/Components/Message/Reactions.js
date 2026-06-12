/*
 * Renders message reactions and handles sending/removing them.
 */

import React, { Component } from 'react';
import TdLibController from '../../Controllers/TdLibController';
import MessageStore from '../../Stores/MessageStore';
import ReactorsModal from './ReactorsModal';
import './Reactions.css';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

class Reactions extends Component {
    constructor(props) {
        super(props);
        this.state = { showPicker: false, reactorsModal: null };
    }

    componentDidMount() {
        this._isMounted = true;
        MessageStore.on('updateMessageReactions', this.onUpdateReactions);
    }

    componentWillUnmount() {
        this._isMounted = false;
        MessageStore.off('updateMessageReactions', this.onUpdateReactions);
    }

    onUpdateReactions = update => {
        const { chatId, messageId } = this.props;
        if (update.chat_id === chatId && update.message_id === messageId) {
            if (this._isMounted) this.forceUpdate();
        }
    };

    handleReactionClick = emoji => {
        const { chatId, messageId } = this.props;
        const message = MessageStore.get(chatId, messageId);
        const reactions = message && message.reactions;
        const existing = reactions && reactions.reactions.find(r => r.reaction === emoji);
        TdLibController.send({
            '@type': 'sendMessageReaction',
            chat_id: chatId,
            message_id: messageId,
            reaction: existing && existing.is_chosen ? null : emoji,
        });
        this.setState({ showPicker: false });
    };

    handleReactionLongPress = (e, emoji) => {
        e.preventDefault();
        const { chatId, messageId } = this.props;
        this.setState({ reactorsModal: { chatId, messageId, reaction: emoji } });
    };

    handleTogglePicker = e => {
        e.stopPropagation();
        this.setState(s => ({ showPicker: !s.showPicker }));
    };

    handleCloseReactors = () => {
        this.setState({ reactorsModal: null });
    };

    render() {
        const { chatId, messageId } = this.props;
        const { showPicker, reactorsModal } = this.state;
        const message = MessageStore.get(chatId, messageId);
        const reactions = message && message.reactions;
        const list = reactions ? reactions.reactions : [];

        return (
            <div className='reactions-wrap'>
                {list.map(r => (
                    <button
                        key={r.reaction}
                        className={`reaction-bubble${r.is_chosen ? ' reaction-chosen' : ''}`}
                        onClick={() => this.handleReactionClick(r.reaction)}
                        onContextMenu={e => this.handleReactionLongPress(e, r.reaction)}
                        title={r.reaction}>
                        <span className='reaction-emoji'>{r.reaction}</span>
                        <span className='reaction-count'>{r.total_count}</span>
                    </button>
                ))}
                <button className='reaction-add-btn' onClick={this.handleTogglePicker} title='Add reaction'>
                    +
                </button>
                {showPicker && (
                    <div className='reaction-picker'>
                        {QUICK_REACTIONS.map(emoji => (
                            <button
                                key={emoji}
                                className='reaction-picker-item'
                                onClick={() => this.handleReactionClick(emoji)}>
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
                {reactorsModal && (
                    <ReactorsModal
                        open={true}
                        chatId={reactorsModal.chatId}
                        messageId={reactorsModal.messageId}
                        reaction={reactorsModal.reaction}
                        onClose={this.handleCloseReactors}
                    />
                )}
            </div>
        );
    }
}

export default Reactions;
