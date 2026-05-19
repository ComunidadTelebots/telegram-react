/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import Dialog from '../Tile/Dialog';
import ChatStore from '../../Stores/ChatStore';
import TdLibController from '../../Controllers/TdLibController';

class ArchiveList extends Component {
    constructor(props) {
        super(props);
        this._isMounted = false;
        this.state = { chatIds: [] };
    }

    componentDidMount() {
        this._isMounted = true;
        this.load();
        ChatStore.on('updateChatChatList', this.onUpdateChatChatList);
        ChatStore.on('updateChatLastMessage', this.onUpdateChatOrder);
        ChatStore.on('updateChatOrder', this.onUpdateChatOrder);
    }

    componentWillUnmount() {
        this._isMounted = false;
        ChatStore.off('updateChatChatList', this.onUpdateChatChatList);
        ChatStore.off('updateChatLastMessage', this.onUpdateChatOrder);
        ChatStore.off('updateChatOrder', this.onUpdateChatOrder);
    }

    onUpdateChatChatList = () => {
        this.load();
    };

    onUpdateChatOrder = update => {
        const archive = ChatStore.chatList.get('chatListArchive');
        if (archive && archive.has(update.chat_id)) {
            this.load();
        }
    };

    async load() {
        try {
            const result = await TdLibController.send({
                '@type': 'getChats',
                chat_list: { '@type': 'chatListArchive' },
                limit: 200
            });
            if (this._isMounted) {
                this.setState({ chatIds: result.chat_ids || [] });
            }
        } catch (e) {
            console.warn('[ArchiveList] load error', e);
        }
    }

    render() {
        const { chatIds } = this.state;
        return (
            <div className='dialogs-list'>
                {chatIds.map(id => (
                    <Dialog key={id} chatId={id} />
                ))}
            </div>
        );
    }
}

export default ArchiveList;
