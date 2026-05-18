/*
 * Traduce los raw updates de GramJS/MTProto al formato updateXxx que esperan los stores.
 */

import { peerToTdlibChatId, translateMessage, translateUser, translateUserStatus } from './EntityTranslator';

export function translateUpdate(update) {
    if (!update) return null;
    const cls = update.className || update._;
    if (!cls) return null;

    switch (cls) {
        // ── Mensajes nuevos ──────────────────────────────────────────────────
        case 'UpdateNewMessage':
        case 'UpdateNewChannelMessage':
            return newMessage(update);

        // ── Mensajes editados ────────────────────────────────────────────────
        case 'UpdateEditMessage':
        case 'UpdateEditChannelMessage':
            return editedMessage(update);

        // ── Mensajes borrados ────────────────────────────────────────────────
        case 'UpdateDeleteMessages':
            return deleteMessages(update, null);
        case 'UpdateDeleteChannelMessages':
            return deleteChannelMessages(update);

        // ── Estado de usuario ────────────────────────────────────────────────
        case 'UpdateUserStatus':
            return userStatus(update);

        // ── Typing ───────────────────────────────────────────────────────────
        case 'UpdateUserTyping':
        case 'UpdateChatUserTyping':
        case 'UpdateChannelUserTyping':
            return typing(update);

        // ── Read ─────────────────────────────────────────────────────────────
        case 'UpdateReadHistoryInbox':
        case 'UpdateReadChannelInbox':
            return readInbox(update);
        case 'UpdateReadHistoryOutbox':
        case 'UpdateReadChannelOutbox':
            return readOutbox(update);

        // ── Chat pinned ──────────────────────────────────────────────────────
        case 'UpdateDialogPinned':
            return dialogPinned(update);

        // ── Draft ────────────────────────────────────────────────────────────
        case 'UpdateDraftMessage':
            return draftMessage(update);

        default:
            return null;
    }
}

// ─── Handlers individuales ────────────────────────────────────────────────────

function newMessage(update) {
    const msg = update.message;
    if (!msg || (msg.className || msg._) === 'MessageEmpty') return null;
    const chatId = peerToTdlibChatId(msg.peerId);
    if (!chatId) return null;
    const message = translateMessage(msg, chatId);
    if (!message) return null;
    return { '@type': 'updateNewMessage', message };
}

function editedMessage(update) {
    const msg = update.message;
    if (!msg) return null;
    const chatId = peerToTdlibChatId(msg.peerId);
    if (!chatId) return null;
    const message = translateMessage(msg, chatId);
    if (!message) return null;
    return {
        '@type': 'updateMessageContent',
        chat_id: chatId,
        message_id: msg.id,
        new_content: message.content
    };
}

function deleteMessages(update, chatId) {
    return {
        '@type': 'updateDeleteMessages',
        chat_id: chatId || 0,
        message_ids: update.messages || [],
        is_permanent: true,
        from_cache: false
    };
}

function deleteChannelMessages(update) {
    const chatId = -1000000000000 - Number(update.channelId);
    return {
        '@type': 'updateDeleteMessages',
        chat_id: chatId,
        message_ids: update.messages || [],
        is_permanent: true,
        from_cache: false
    };
}

function userStatus(update) {
    return {
        '@type': 'updateUserStatus',
        user_id: Number(update.userId),
        status: translateUserStatus(update.status)
    };
}

function typing(update) {
    let chatId = 0;
    let userId = 0;

    if (update.fromId) {
        const fc = update.fromId.className || update.fromId._;
        if (fc === 'PeerUser') userId = Number(update.fromId.userId);
    } else if (update.userId) {
        userId = Number(update.userId);
    }

    if (update.peer) {
        chatId = peerToTdlibChatId(update.peer);
    } else if (update.chatId) {
        chatId = -Number(update.chatId);
    } else if (update.channelId) {
        chatId = -1000000000000 - Number(update.channelId);
    }

    return {
        '@type': 'updateUserChatAction',
        chat_id: chatId,
        message_thread_id: 0,
        sender_id: { '@type': 'messageSenderUser', user_id: userId },
        action: { '@type': 'chatActionTyping' }
    };
}

function readInbox(update) {
    let chatId = 0;
    if (update.peer) chatId = peerToTdlibChatId(update.peer);
    else if (update.channelId) chatId = -1000000000000 - Number(update.channelId);

    return {
        '@type': 'updateChatReadInbox',
        chat_id: chatId,
        last_read_inbox_message_id: update.maxId || 0,
        unread_count: update.stillUnreadCount || 0
    };
}

function readOutbox(update) {
    let chatId = 0;
    if (update.peer) chatId = peerToTdlibChatId(update.peer);
    else if (update.channelId) chatId = -1000000000000 - Number(update.channelId);

    return {
        '@type': 'updateChatReadOutbox',
        chat_id: chatId,
        last_read_outbox_message_id: update.maxId || 0
    };
}

function dialogPinned(update) {
    const chatId = peerToTdlibChatId(update.peer?.peer || update.peer);
    if (!chatId) return null;
    return {
        '@type': 'updateChatIsPinned',
        chat_id: chatId,
        is_pinned: !update.unpinned,
        order: update.unpinned ? '0' : '9223372036854775807'
    };
}

function draftMessage(update) {
    const chatId = peerToTdlibChatId(update.peer);
    if (!chatId) return null;

    const draft = update.draft;
    const draftCls = draft?.className || draft?._;

    return {
        '@type': 'updateChatDraftMessage',
        chat_id: chatId,
        draft_message:
            draftCls === 'DraftMessage'
                ? {
                      '@type': 'draftMessage',
                      reply_to_message_id: draft.replyToMsgId || 0,
                      date: draft.date || 0,
                      input_message_text: {
                          '@type': 'inputMessageText',
                          text: {
                              '@type': 'formattedText',
                              text: draft.message || '',
                              entities: []
                          },
                          disable_web_page_preview: false,
                          clear_draft: false
                      }
                  }
                : null,
        order: '0'
    };
}
