/*
 * Renders message reactions and handles sending/removing them.
 */

import React, { Component } from 'react';
import TdLibController from '../../Controllers/TdLibController';
import MessageStore from '../../Stores/MessageStore';
import './Reactions.css';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

class Reactions extends Component {
    constructor(props) {
        super(props);
        this.state = { showPicker: false };
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
        // Toggle: remove if already chosen, add if not
        TdLibController.send({
            '@type': 'sendMessageReaction',
            chat_id: chatId,
            message_id: messageId,
            reaction: existing && existing.is_chosen ? null : emoji
        });
        this.setState({ showPicker: false });
    };

    handleTogglePicker = e => {
        e.stopPropagation();
        this.setState(s => ({ showPicker: !s.showPicker }));
    };

    render() {
        const { chatId, messageId } = this.props;
        const { showPicker } = this.state;
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
            </div>
        );
    }
}

export default Reactions;
