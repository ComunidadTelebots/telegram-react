/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import TdLibController from '../../Controllers/TdLibController';
import './QuickReactionBar.css';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏'];

class QuickReactionBar extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = { reactions: QUICK_EMOJIS };
    }

    componentDidMount() {
        this.loadAvailableReactions();
    }

    loadAvailableReactions = async () => {
        try {
            const result = await TdLibController.send({ '@type': 'getAvailableReactions' });
            const reactions = result?.reactions || [];
            if (reactions.length) {
                this.setState({ reactions: reactions.slice(0, 8) });
            }
        } catch (e) {
            console.warn('[QuickReactionBar] getAvailableReactions error', e);
        }
    };

    handleReact = async emoji => {
        const { chatId, messageId, onClose } = this.props;
        onClose && onClose();
        try {
            await TdLibController.send({
                '@type': 'setMessageReaction',
                chat_id: chatId,
                message_id: messageId,
                reaction: emoji,
                is_big: false,
            });
        } catch (e) {
            console.warn('[QuickReactionBar] setMessageReaction error', e);
        }
    };

    handleSetDefaultReaction = async (event, emoji) => {
        event.preventDefault();
        event.stopPropagation();
        const { onClose } = this.props;
        try {
            await TdLibController.send({ '@type': 'setDefaultReaction', reaction: emoji });
        } catch (e) {
            console.warn('[QuickReactionBar] setDefaultReaction error', e);
        }
        onClose && onClose();
    };

    render() {
        const { reactions } = this.state;

        return (
            <div className='quick-reaction-bar' onMouseDown={e => e.preventDefault()}>
                {reactions.map(emoji => (
                    <button
                        key={emoji}
                        className='quick-reaction-btn'
                        title='Click para reaccionar; click derecho para predeterminada'
                        onClick={() => this.handleReact(emoji)}
                        onContextMenu={event => this.handleSetDefaultReaction(event, emoji)}>
                        {emoji}
                    </button>
                ))}
            </div>
        );
    }
}

QuickReactionBar.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    onClose: PropTypes.func,
};

export default QuickReactionBar;
