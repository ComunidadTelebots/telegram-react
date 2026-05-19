/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import ChatStore from '../Stores/ChatStore';
import { orderCompare } from './Common';

export function getArchiveTitle() {
    const archive = ChatStore.chatList.get('chatListArchive');
    const chats = [];
    if (archive) {
        for (const chatId of archive.keys()) {
            const chat = ChatStore.get(chatId);
            if (chat && chat.order !== '0') chats.push(chat);
        }
    }

    return chats
        .sort((a, b) => orderCompare(b.order, a.order))
        .map(x => x.title)
        .join(', ');
}
