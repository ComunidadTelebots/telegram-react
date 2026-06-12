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

    render() {
        return (
            <div className='quick-reaction-bar' onMouseDown={e => e.preventDefault()}>
                {QUICK_EMOJIS.map(emoji => (
                    <button
                        key={emoji}
                        className='quick-reaction-btn'
                        title={emoji}
                        onClick={() => this.handleReact(emoji)}>
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
