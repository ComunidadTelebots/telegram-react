/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Photo from './Media/Photo';
import Video from './Media/Video';
import Meta from './Meta';
import { openMedia } from '../../Utils/Message';
import MessageStore from '../../Stores/MessageStore';
import './Album.css';

const ALBUM_ITEM_SIZE = 200;

class Album extends React.Component {
    getPhotoFromMessage(message) {
        const { content } = message;
        if (!content) return null;
        if (content['@type'] === 'messagePhoto') return content.photo;
        return null;
    }

    getVideoFromMessage(message) {
        const { content } = message;
        if (!content) return null;
        if (content['@type'] === 'messageVideo') return content.video;
        return null;
    }

    renderItem(chatId, messageId, index, total) {
        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const photo = this.getPhotoFromMessage(message);
        const video = this.getVideoFromMessage(message);

        const isFirst = index === 0;
        const isLast = index === total - 1;

        return (
            <div
                key={messageId}
                className={classNames('album-item', {
                    'album-item-first': isFirst,
                    'album-item-last': isLast,
                })}>
                {photo && (
                    <Photo
                        chatId={chatId}
                        messageId={messageId}
                        photo={photo}
                        displaySize={ALBUM_ITEM_SIZE}
                        openMedia={() => openMedia(chatId, messageId)}
                        showProgress
                        style={{ width: '100%', height: '100%' }}
                    />
                )}
                {video && (
                    <Video
                        chatId={chatId}
                        messageId={messageId}
                        video={video}
                        openMedia={() => openMedia(chatId, messageId)}
                        showProgress
                    />
                )}
            </div>
        );
    }

    render() {
        const { chatId, messageIds, showTitle, showTail, showUnreadSeparator } = this.props;
        if (!messageIds || messageIds.length === 0) return null;

        const lastMessageId = messageIds[messageIds.length - 1];
        const lastMessage = MessageStore.get(chatId, lastMessageId);
        const isOutgoing = lastMessage && lastMessage.is_outgoing;
        const date = lastMessage ? lastMessage.date : 0;

        const caption = (() => {
            for (let i = messageIds.length - 1; i >= 0; i--) {
                const msg = MessageStore.get(chatId, messageIds[i]);
                if (msg && msg.content && msg.content.caption && msg.content.caption.text) {
                    return msg.content.caption.text;
                }
            }
            return null;
        })();

        const cols = messageIds.length <= 2 ? messageIds.length : Math.min(3, messageIds.length);

        return (
            <div
                className={classNames('album-wrapper', {
                    'album-out': isOutgoing,
                    'album-in': !isOutgoing,
                })}>
                {showUnreadSeparator && <div className='album-unread-separator'>Mensajes no leídos</div>}
                <div className='album-grid' style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                    {messageIds.map((id, i) => this.renderItem(chatId, id, i, messageIds.length))}
                </div>
                {caption && <div className='album-caption'>{caption}</div>}
                {date > 0 && <Meta date={date} />}
            </div>
        );
    }
}

Album.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageIds: PropTypes.arrayOf(PropTypes.number).isRequired,
    showTitle: PropTypes.bool,
    showTail: PropTypes.bool,
    showUnreadSeparator: PropTypes.bool,
};

export default Album;
