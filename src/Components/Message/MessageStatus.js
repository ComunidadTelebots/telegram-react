/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import ChatStore from '../../Stores/ChatStore';
import MessageStore from '../../Stores/MessageStore';
import GramJsController from '../../Controllers/GramJsController';
import './MessageStatus.css';
import PropTypes from 'prop-types';

const styles = theme => ({
    messageStatusFailed: {
        color: theme.palette.error.main,
    },
    messageStatusPending: {
        color: theme.palette.text.disabled,
    },
    messageStatusRead: {
        color: theme.palette.primary.main,
    },
    messageStatusSent: {
        color: theme.palette.text.secondary,
    },
});

// Cache: `${chatId}_${messageId}` → unix timestamp (seconds) or null (hidden/error)
const outboxReadDateCache = new Map();

function isPrivateChatId(chatId) {
    const chat = ChatStore.get(chatId);
    return chat && chat.type && chat.type['@type'] === 'chatTypePrivate';
}

function formatReadTime(unixSec) {
    const d = new Date(unixSec * 1000);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

class MessageStatus extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            prevChatId: props.chatId,
            prevMessageId: props.messageId,
            sendingState: props.sendingState,
            unread: true,
            readTime: null,
        };
    }

    static getDerivedStateFromProps(props, state) {
        if (props.chatId !== state.prevChatId || props.messageId !== state.prevMessageId) {
            return {
                prevChatId: props.chatId,
                prevMessageId: props.messageId,
                sendingState: props.sendingState,
                readTime: null,
            };
        }

        return null;
    }

    componentDidMount() {
        ChatStore.on('updateChatReadOutbox', this.onUpdateChatReadOutbox);

        MessageStore.on('updateMessageSendFailed', this.onUpdateMessageSend);
        MessageStore.on('updateMessageSendSucceeded', this.onUpdateMessageSend);
    }

    componentWillUnmount() {
        ChatStore.off('updateChatReadOutbox', this.onUpdateChatReadOutbox);

        MessageStore.off('updateMessageSendFailed', this.onUpdateMessageSend);
        MessageStore.off('updateMessageSendSucceeded', this.onUpdateMessageSend);
    }

    onUpdateMessageSend = update => {
        const { chatId, messageId } = this.props;
        const { old_message_id, message } = update;

        if (messageId !== old_message_id) return;
        if (!message) return;

        const { chat_id, id, sending_state } = message;
        if (chatId !== chat_id) return;

        this.newMessageId = id;
        this.setState({ sendingState: sending_state });
    };

    onUpdateChatReadOutbox = update => {
        const { chatId, messageId } = this.props;
        const { chat_id, last_read_outbox_message_id } = update;
        const { newMessageId } = this;

        if (chatId !== chat_id) return;

        if ((newMessageId && newMessageId <= last_read_outbox_message_id) || messageId <= last_read_outbox_message_id) {
            this.setState({ sendingState: null, unread: false, readTime: null });
        }
    };

    handleMouseEnter = async () => {
        const { chatId, messageId } = this.props;
        const { sendingState, unread, readTime } = this.state;

        if (sendingState || unread) return;
        if (readTime !== null) return;
        if (!isPrivateChatId(chatId)) return;

        const cacheKey = `${chatId}_${messageId}`;
        if (outboxReadDateCache.has(cacheKey)) {
            const cached = outboxReadDateCache.get(cacheKey);
            if (cached) this.setState({ readTime: cached });
            return;
        }

        try {
            const date = await GramJsController.getOutboxReadDate(chatId, messageId);
            outboxReadDateCache.set(cacheKey, date || null);
            if (date) this.setState({ readTime: date });
        } catch {
            outboxReadDateCache.set(cacheKey, null);
        }
    };

    render() {
        const { classes } = this.props;
        const { sendingState, unread, readTime } = this.state;

        if (sendingState) {
            if (sendingState['@type'] === 'messageSendingStateFailed') {
                return <span className={classNames('message-status-check', classes.messageStatusFailed)}>!</span>;
            }
            return <span className={classNames('message-status-check', classes.messageStatusPending)}>✓</span>;
        }

        if (!unread) {
            const tooltip = readTime ? `Leído ${formatReadTime(readTime)}` : undefined;
            return (
                <span
                    className={classNames('message-status-check', classes.messageStatusRead)}
                    onMouseEnter={this.handleMouseEnter}
                    title={tooltip}>
                    ✓✓
                </span>
            );
        }

        return <span className={classNames('message-status-check', classes.messageStatusSent)}>✓</span>;
    }
}

MessageStatus.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    sendingState: PropTypes.object,
};

export default withStyles(styles, { withTheme: true })(MessageStatus);
