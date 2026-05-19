/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { compose } from 'recompose';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/Close';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import ReplyTile from '../Tile/ReplyTile';
import { accentStyles, borderStyle } from '../Theme';
import { canPinMessages } from '../../Utils/Chat';
import { getContent, getReplyMinithumbnail, getReplyPhotoSize, isDeletedMessage } from '../../Utils/Message';
import { loadMessageContents } from '../../Utils/File';
import { openChat } from '../../Actions/Client';
import ChatStore from '../../Stores/ChatStore';
import FileStore from '../../Stores/FileStore';
import MessageStore from '../../Stores/MessageStore';
import TdLibController from '../../Controllers/TdLibController';
import './PinnedMessage.css';
import AppStore from '../../Stores/ApplicationStore';

const styles = theme => ({
    ...accentStyles(theme),
    ...borderStyle(theme),
    pinnedMessage: {
        background: theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF',
        color: theme.palette.text.primary
    }
});

class PinnedMessage extends React.Component {
    constructor(props) {
        super(props);

        this.state = { pinnedIds: [], currentIndex: 0 };
    }

    static getDerivedStateFromProps(props, state) {
        const { prevPropsChatId } = state;
        const { chatId } = props;

        if (prevPropsChatId !== chatId) {
            const chat = ChatStore.get(chatId);
            const firstId = chat && chat.pinned_message_id ? chat.pinned_message_id : 0;
            return {
                prevPropsChatId: chatId,
                clientData: ChatStore.getClientData(chatId),
                messageId: firstId,
                pinnedIds: firstId ? [firstId] : [],
                currentIndex: 0,
                confirm: false
            };
        }

        return null;
    }

    componentDidUpdate(prevProps, prevState) {
        const { messageId } = this.state;

        if (messageId && prevState.messageId !== messageId) {
            this.loadContent();
        }

        if (prevProps.chatId !== this.props.chatId) {
            this.loadAllPinned();
        }
    }

    componentDidMount() {
        this.loadContent();
        this.loadAllPinned();

        AppStore.on('clientUpdateDialogsReady', this.onClientUpdateDialogsReady);
        ChatStore.on('clientUpdateSetChatClientData', this.onClientUpdateSetChatClientData);
        ChatStore.on('updateChatPinnedMessage', this.onUpdateChatPinnedMessage);
    }

    componentWillUnmount() {
        AppStore.off('clientUpdateDialogsReady', this.onClientUpdateDialogsReady);
        ChatStore.off('clientUpdateSetChatClientData', this.onClientUpdateSetChatClientData);
        ChatStore.off('updateChatPinnedMessage', this.onUpdateChatPinnedMessage);
    }

    loadAllPinned = async () => {
        const { chatId } = this.props;
        if (!chatId) return;
        try {
            const result = await TdLibController.send({
                '@type': 'searchChatMessages',
                chat_id: chatId,
                query: '',
                sender_user_id: 0,
                from_message_id: 0,
                offset: 0,
                limit: 50,
                filter: { '@type': 'searchMessagesFilterPinned' }
            });
            if (result && result.messages && result.messages.length > 0) {
                const pinnedIds = result.messages.map(m => m.id);
                result.messages.forEach(m => MessageStore.set(m));
                this.setState({ pinnedIds, messageId: pinnedIds[0], currentIndex: 0 });
            }
        } catch (e) {
            // older TDLib may not support this filter — fall back to single pin
        }
    };

    onClientUpdateDialogsReady = update => {
        const { messageId } = this.state;
        if (messageId) this.loadContent();
    };

    onClientUpdateSetChatClientData = update => {
        const { chatId, clientData } = update;
        if (this.props.chatId !== chatId) return;
        this.setState({ clientData });
    };

    onUpdateChatPinnedMessage = update => {
        const { chat_id, pinned_message_id: newId } = update;
        const { chatId } = this.props;
        if (chatId !== chat_id) return;

        this.setState(state => {
            const ids = state.pinnedIds.includes(newId)
                ? state.pinnedIds
                : newId
                ? [newId, ...state.pinnedIds]
                : state.pinnedIds;
            return { pinnedIds: ids, messageId: newId || (ids.length ? ids[0] : 0), currentIndex: 0 };
        });
    };

    loadContent = () => {
        const { chatId } = this.props;
        const { messageId } = this.state;

        if (!chatId || !messageId) return;

        const message = MessageStore.get(chatId, messageId);
        if (message) return;

        TdLibController.send({ '@type': 'getMessage', chat_id: chatId, message_id: messageId })
            .then(result => {
                MessageStore.set(result);
                const store = FileStore.getStore();
                loadMessageContents(store, [result]);
                this.forceUpdate();
            })
            .catch(error => {
                if (error.message !== 'Chat not found') {
                    MessageStore.set({ '@type': 'deletedMessage', chat_id: chatId, id: messageId, content: null });
                    this.forceUpdate();
                }
            });
    };

    shouldComponentUpdate(nextProps, nextState) {
        const { chatId, t, theme } = this.props;
        const { clientData, confirm, messageId, pinnedIds, currentIndex } = this.state;

        if (nextProps.t !== t) return true;
        if (nextProps.theme !== theme) return true;
        if (nextProps.chatId !== chatId) return true;
        if (nextState.clientData !== clientData) return true;
        if (nextState.confirm !== confirm) return true;
        if (nextState.messageId !== messageId) return true;
        if (nextState.pinnedIds !== pinnedIds) return true;
        if (nextState.currentIndex !== currentIndex) return true;

        return false;
    }

    handleClick = event => {
        const { chatId } = this.props;
        const { messageId } = this.state;
        if (!messageId) return;
        openChat(chatId, messageId);
    };

    handleNext = event => {
        event.stopPropagation();
        const { pinnedIds, currentIndex } = this.state;
        if (pinnedIds.length <= 1) return;
        const nextIndex = (currentIndex + 1) % pinnedIds.length;
        const messageId = pinnedIds[nextIndex];
        this.setState({ currentIndex: nextIndex, messageId }, this.loadContent);
    };

    handleDelete = async event => {
        event.preventDefault();
        event.stopPropagation();

        const { chatId } = this.props;
        const { messageId } = this.state;

        const canPin = canPinMessages(chatId);
        if (canPin) {
            this.setState({ confirm: true });
        } else {
            const data = ChatStore.getClientData(chatId);
            await TdLibController.clientUpdate({
                '@type': 'clientUpdateSetChatClientData',
                chatId,
                clientData: Object.assign({}, data, { unpinned_message_id: messageId })
            });
        }
    };

    handleUnpin = async () => {
        const { chatId } = this.props;
        const { messageId } = this.state;
        this.handleClose();
        TdLibController.send({ '@type': 'unpinChatMessage', chat_id: chatId, message_id: messageId });
    };

    handleClose = () => {
        this.setState({ confirm: false });
    };

    render() {
        const { chatId, classes, t } = this.props;
        const { messageId, confirm, pinnedIds, currentIndex } = this.state;

        if (!chatId) return null;

        const { unpinned_message_id } = ChatStore.getClientData(chatId);
        if (unpinned_message_id === messageId) return null;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        let content = getContent(message, t);
        const photoSize = getReplyPhotoSize(chatId, messageId);
        const minithumbnail = getReplyMinithumbnail(chatId, messageId);

        if (isDeletedMessage(message)) content = t('DeletedMessage');

        const total = pinnedIds.length;
        const label = total > 1 ? `${t('PinnedMessage')} ${total - currentIndex} of ${total}` : t('PinnedMessage');

        return (
            <>
                <div
                    className={classNames('pinned-message', classes.pinnedMessage, classes.borderColor)}
                    onMouseDown={this.handleClick}>
                    <div className='pinned-message-wrapper'>
                        {total > 1 && (
                            <div
                                className='pinned-message-counter'
                                onMouseDown={this.handleNext}
                                title='Next pinned message'>
                                {Array.from({ length: Math.min(total, 4) }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={classNames('pinned-counter-bar', {
                                            'pinned-counter-bar-active':
                                                i === (total - 1 - currentIndex) % Math.min(total, 4)
                                        })}
                                    />
                                ))}
                            </div>
                        )}
                        <div className='border reply-border' />
                        {photoSize && (
                            <ReplyTile
                                chatId={chatId}
                                messageId={messageId}
                                photoSize={photoSize}
                                minithumbnail={minithumbnail}
                            />
                        )}
                        <div className='pinned-message-content'>
                            <div className='pinned-message-content-title'>{label}</div>
                            <div className='pinned-message-content-subtitle'>{content}</div>
                        </div>
                        <div className='pinned-message-delete-button'>
                            <IconButton onClick={this.handleDelete}>
                                <CloseIcon />
                            </IconButton>
                        </div>
                    </div>
                </div>
                {confirm && (
                    <Dialog
                        transitionDuration={0}
                        open
                        onClose={this.handleClose}
                        aria-labelledby='unpin-message-confirmation'>
                        <DialogTitle id='unpin-message-confirmation'>{t('Confirm')}</DialogTitle>
                        <DialogContent>
                            <DialogContentText>{t('UnpinMessageAlert')}</DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={this.handleClose} color='primary'>
                                {t('Cancel')}
                            </Button>
                            <Button onClick={this.handleUnpin} color='primary'>
                                {t('Ok')}
                            </Button>
                        </DialogActions>
                    </Dialog>
                )}
            </>
        );
    }
}

PinnedMessage.propTypes = {
    chatId: PropTypes.number.isRequired
};

const enhance = compose(withStyles(styles, { withTheme: true }), withTranslation());

export default enhance(PinnedMessage);
