/*
 * Renders message reactions and handles sending/removing them.
 */

import React, { Component } from 'react';
import TdLibController from '../../Controllers/TdLibController';
import MessageStore from '../../Stores/MessageStore';
import GramJsController from '../../Controllers/GramJsController';
import ReactorsModal from './ReactorsModal';
import './Reactions.css';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const readReactionChats = new Set();

class Reactions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showPicker: false,
            reactorsModal: null,
            availableReactions: QUICK_REACTIONS,
            paidOptimistic: 0,
            paidSending: false,
        };
    }

    componentDidMount() {
        this._isMounted = true;
        MessageStore.on('updateMessageReactions', this.onUpdateReactions);
        this.markUnreadReactionsAsRead();
        this.loadAvailableReactions();
    }

    componentDidUpdate() {
        this.markUnreadReactionsAsRead();
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

    handleReactionClick = (emoji, event) => {
        const { chatId, messageId } = this.props;
        const message = MessageStore.get(chatId, messageId);
        const reactions = message && message.reactions;
        const existing = reactions && reactions.reactions.find(r => r.reaction === emoji);

        if (!(existing && existing.is_chosen) && event && event.currentTarget) {
            this.spawnParticles(event.currentTarget);
        }

        TdLibController.send({
            '@type': 'sendMessageReaction',
            chat_id: chatId,
            message_id: messageId,
            reaction: existing && existing.is_chosen ? null : emoji,
        });
        this.setState({ showPicker: false });
    };

    spawnParticles = target => {
        const COUNT = 8;
        for (let i = 0; i < COUNT; i++) {
            const el = document.createElement('span');
            el.className = 'reaction-particle';
            const angle = (i / COUNT) * 2 * Math.PI;
            const dist = 18 + Math.random() * 12;
            el.style.setProperty('--px', `${Math.cos(angle) * dist}px`);
            el.style.setProperty('--py', `${Math.sin(angle) * dist}px`);
            el.style.animationDelay = `${Math.random() * 0.08}s`;
            target.appendChild(el);
            setTimeout(() => el.remove(), 650);
        }
    };

    handleReactionLongPress = (e, emoji) => {
        e.preventDefault();
        const { chatId, messageId } = this.props;
        this.setState({ reactorsModal: { chatId, messageId, reaction: emoji } });
    };

    handleSetDefaultReaction = async (event, emoji) => {
        event.preventDefault();
        event.stopPropagation();
        try {
            await TdLibController.send({ '@type': 'setDefaultReaction', reaction: emoji });
        } catch (e) {
            console.warn('[Reactions] setDefaultReaction error', e);
        }
        this.setState({ showPicker: false });
    };

    handleTogglePicker = e => {
        e.stopPropagation();
        this.setState(s => ({ showPicker: !s.showPicker }));
    };

    handlePaidReactionClick = async e => {
        e.stopPropagation();
        const { chatId, messageId } = this.props;
        if (this.state.paidSending) return;
        this.setState(s => ({ paidOptimistic: s.paidOptimistic + 1, paidSending: true }));
        try {
            await GramJsController.sendPaidReaction(chatId, messageId, 1);
        } catch (err) {
            const msg = err && (err.message || String(err));
            if (msg && msg.includes('STARS_TOO_FRESH')) {
                alert('No tienes suficientes estrellas.');
            }
            this.setState(s => ({ paidOptimistic: Math.max(0, s.paidOptimistic - 1) }));
        } finally {
            this.setState({ paidSending: false });
        }
    };

    handleCloseReactors = () => {
        this.setState({ reactorsModal: null });
    };

    loadAvailableReactions = async () => {
        try {
            const result = await TdLibController.send({ '@type': 'getAvailableReactions' });
            const reactions = result?.reactions || [];
            if (this._isMounted && reactions.length) {
                this.setState({ availableReactions: reactions.slice(0, 12) });
            }
        } catch (e) {
            console.warn('[Reactions] getAvailableReactions error', e);
        }
    };

    markUnreadReactionsAsRead = () => {
        const { chatId, messageId } = this.props;
        const message = MessageStore.get(chatId, messageId);
        const reactions = message && message.reactions;
        if (!reactions || !reactions.has_unread_reactions || readReactionChats.has(chatId)) return;

        readReactionChats.add(chatId);
        TdLibController.send({ '@type': 'readAllMessageReactions', chat_id: chatId });
        reactions.has_unread_reactions = false;
        if (reactions.recent_reactions) {
            reactions.recent_reactions.forEach(r => {
                r.is_unread = false;
            });
        }
    };

    render() {
        const { chatId, messageId } = this.props;
        const { showPicker, reactorsModal, availableReactions, paidOptimistic, paidSending } = this.state;
        const message = MessageStore.get(chatId, messageId);
        const reactions = message && message.reactions;
        const list = reactions ? reactions.reactions : [];
        const paidCount = (reactions ? reactions.paid_total_count || 0 : 0) + paidOptimistic;
        const unreadReactions = new Set(
            reactions && reactions.recent_reactions
                ? reactions.recent_reactions.filter(r => r.is_unread).map(r => r.reaction)
                : [],
        );

        return (
            <div className='reactions-wrap'>
                {paidCount > 0 && (
                    <button
                        className='reaction-paid-badge'
                        title={`${paidCount} paid reactions`}
                        onClick={e => this.setState({ reactorsModal: { chatId, messageId, reaction: 'paid' } })}>
                        ⭐ <span className='reaction-paid-count'>{paidCount}</span>
                    </button>
                )}
                <button
                    className={`reaction-paid-add${paidSending ? ' reaction-paid-sending' : ''}`}
                    onClick={this.handlePaidReactionClick}
                    title='Send a star reaction'>
                    +⭐
                </button>
                {list.map(r => (
                    <button
                        key={r.reaction}
                        className={`reaction-bubble${r.is_chosen ? ' reaction-chosen' : ''}${
                            unreadReactions.has(r.reaction) ? ' reaction-unread' : ''
                        }`}
                        onClick={e => this.handleReactionClick(r.reaction, e)}
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
                        {availableReactions.map(emoji => (
                            <button
                                key={emoji}
                                className='reaction-picker-item'
                                onClick={e => this.handleReactionClick(emoji, e)}
                                onContextMenu={event => this.handleSetDefaultReaction(event, emoji)}
                                title='Click para reaccionar; click derecho para predeterminada'>
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
