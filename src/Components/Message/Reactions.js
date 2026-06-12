/*
 * Renders message reactions and handles sending/removing them.
 * Extended: expanded picker with search, big-reaction on double-click,
 * hover tooltip with reactor names, collapse when >5 reactions.
 */

import React, { Component } from 'react';
import TdLibController from '../../Controllers/TdLibController';
import MessageStore from '../../Stores/MessageStore';
import ReactorsModal from './ReactorsModal';
import './Reactions.css';

const ALL_REACTIONS = [
    '👍',
    '❤️',
    '😂',
    '😮',
    '😢',
    '🔥',
    '🎉',
    '👏',
    '🤔',
    '🤯',
    '😍',
    '🥰',
    '😎',
    '🤩',
    '🙌',
    '💯',
    '👎',
    '💔',
    '😡',
    '😱',
    '🤦',
    '🙏',
    '✨',
    '🫡',
];

const MAX_VISIBLE = 5;

class Reactions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showPicker: false,
            pickerSearch: '',
            reactorsModal: null,
            expanded: false,
            tooltip: null,
            tooltipReaction: null,
            tooltipNames: [],
        };
        this.tooltipTimeout = null;
        this.pickerRef = null;
    }

    componentDidMount() {
        this._isMounted = true;
        MessageStore.on('updateMessageReactions', this.onUpdateReactions);
        document.addEventListener('mousedown', this.handleOutsideClick);
    }

    componentWillUnmount() {
        this._isMounted = false;
        MessageStore.off('updateMessageReactions', this.onUpdateReactions);
        document.removeEventListener('mousedown', this.handleOutsideClick);
        clearTimeout(this.tooltipTimeout);
    }

    onUpdateReactions = update => {
        const { chatId, messageId } = this.props;
        if (update.chat_id === chatId && update.message_id === messageId) {
            if (this._isMounted) this.forceUpdate();
        }
    };

    handleOutsideClick = e => {
        if (this.pickerRef && !this.pickerRef.contains(e.target)) {
            this.setState({ showPicker: false, pickerSearch: '' });
        }
    };

    sendReaction = (emoji, isBig = false) => {
        const { chatId, messageId } = this.props;
        const message = MessageStore.get(chatId, messageId);
        const reactions = message && message.reactions;
        const existing = reactions && reactions.reactions.find(r => r.reaction === emoji);
        TdLibController.send({
            '@type': 'sendMessageReaction',
            chat_id: chatId,
            message_id: messageId,
            reaction: existing && existing.is_chosen && !isBig ? null : emoji,
            is_big: isBig,
        });
    };

    handleReactionClick = emoji => {
        this.sendReaction(emoji, false);
        this.setState({ showPicker: false, pickerSearch: '' });
    };

    handleReactionDoubleClick = (e, emoji) => {
        e.preventDefault();
        e.stopPropagation();
        this.sendReaction(emoji, true);
        const el = e.currentTarget;
        el.classList.add('reaction-big-pulse');
        setTimeout(() => el && el.classList.remove('reaction-big-pulse'), 600);
    };

    handleReactionLongPress = (e, emoji) => {
        e.preventDefault();
        const { chatId, messageId } = this.props;
        this.setState({ reactorsModal: { chatId, messageId, reaction: emoji } });
    };

    handleTogglePicker = e => {
        e.stopPropagation();
        this.setState(s => ({ showPicker: !s.showPicker, pickerSearch: '' }));
    };

    handleCloseReactors = () => {
        this.setState({ reactorsModal: null });
    };

    handleMouseEnterBubble = (e, emoji) => {
        const { chatId, messageId } = this.props;
        const rect = e.currentTarget.getBoundingClientRect();
        this.setState({
            tooltip: { top: rect.top, left: rect.left + rect.width / 2 },
            tooltipReaction: emoji,
            tooltipNames: [],
        });
        clearTimeout(this.tooltipTimeout);
        this.tooltipTimeout = setTimeout(async () => {
            try {
                const result = await TdLibController.send({
                    '@type': 'getMessageReactors',
                    chat_id: chatId,
                    message_id: messageId,
                    reaction: emoji,
                });
                const names = (result.reactors || [])
                    .slice(0, 5)
                    .map(r => r.sender_name || '')
                    .filter(Boolean);
                if (this._isMounted && this.state.tooltipReaction === emoji) {
                    this.setState({ tooltipNames: names });
                }
            } catch {
                // silent
            }
        }, 400);
    };

    handleMouseLeaveBubble = () => {
        clearTimeout(this.tooltipTimeout);
        this.setState({ tooltip: null, tooltipReaction: null, tooltipNames: [] });
    };

    render() {
        const { chatId, messageId } = this.props;
        const { showPicker, pickerSearch, reactorsModal, expanded, tooltip, tooltipNames } = this.state;
        const message = MessageStore.get(chatId, messageId);
        const reactions = message && message.reactions;
        const list = reactions ? reactions.reactions : [];

        const visibleList = expanded || list.length <= MAX_VISIBLE ? list : list.slice(0, MAX_VISIBLE);
        const hiddenCount = list.length - MAX_VISIBLE;

        const filteredEmojis = pickerSearch ? ALL_REACTIONS.filter(e => e.includes(pickerSearch)) : ALL_REACTIONS;

        return (
            <div className='reactions-wrap'>
                {visibleList.map(r => (
                    <button
                        key={r.reaction}
                        className={`reaction-bubble${r.is_chosen ? ' reaction-chosen' : ''}`}
                        onClick={() => this.handleReactionClick(r.reaction)}
                        onDoubleClick={e => this.handleReactionDoubleClick(e, r.reaction)}
                        onContextMenu={e => this.handleReactionLongPress(e, r.reaction)}
                        onMouseEnter={e => this.handleMouseEnterBubble(e, r.reaction)}
                        onMouseLeave={this.handleMouseLeaveBubble}
                        title={r.reaction}>
                        <span className='reaction-emoji'>{r.reaction}</span>
                        <span className='reaction-count'>{r.total_count}</span>
                    </button>
                ))}
                {!expanded && hiddenCount > 0 && (
                    <button
                        className='reaction-more-btn'
                        onClick={() => this.setState({ expanded: true })}
                        title={`Ver ${hiddenCount} más`}>
                        +{hiddenCount}
                    </button>
                )}
                <button className='reaction-add-btn' onClick={this.handleTogglePicker} title='Añadir reacción'>
                    +
                </button>
                {showPicker && (
                    <div className='reaction-picker-panel' ref={r => (this.pickerRef = r)}>
                        <input
                            className='reaction-picker-search'
                            placeholder='Buscar…'
                            value={pickerSearch}
                            onChange={e => this.setState({ pickerSearch: e.target.value })}
                            autoFocus
                        />
                        <div className='reaction-picker-grid'>
                            {filteredEmojis.map(emoji => (
                                <button
                                    key={emoji}
                                    className='reaction-picker-item'
                                    onClick={() => this.handleReactionClick(emoji)}>
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {tooltip && tooltipNames.length > 0 && (
                    <div
                        className='reaction-tooltip'
                        style={{ position: 'fixed', top: tooltip.top - 40, left: tooltip.left }}>
                        {tooltipNames.join(', ')}
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
