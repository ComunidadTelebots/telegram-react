/*
 * Traduce los raw updates de GramJS/MTProto al formato updateXxx que esperan los stores.
 */

import {
    peerToTdlibChatId,
    translateMessage,
    translateUser,
    translateUserStatus,
    translateReactions,
} from './EntityTranslator';

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

        // ── Reacciones ───────────────────────────────────────────────────────
        case 'UpdateMessageReactions':
            return messageReactions(update);

        // ── Chat title/photo ─────────────────────────────────────────────────
        case 'UpdateChatTitle':
            return chatTitle(update);
        case 'UpdateChatPhoto':
            return chatPhoto(update);

        // ── Pinned messages ──────────────────────────────────────────────────
        case 'UpdatePinnedMessages':
            return pinnedMessages(update, false);
        case 'UpdatePinnedChannelMessages':
            return pinnedMessages(update, true);

        // ── Unread marks ─────────────────────────────────────────────────────
        case 'UpdateDialogUnreadMark':
            return dialogUnreadMark(update);

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
        new_content: message.content,
    };
}

function deleteMessages(update, chatId) {
    return {
        '@type': 'updateDeleteMessages',
        chat_id: chatId || 0,
        message_ids: update.messages || [],
        is_permanent: true,
        from_cache: false,
    };
}

function deleteChannelMessages(update) {
    const chatId = -1000000000000 - Number(update.channelId);
    return {
        '@type': 'updateDeleteMessages',
        chat_id: chatId,
        message_ids: update.messages || [],
        is_permanent: true,
        from_cache: false,
    };
}

function userStatus(update) {
    return {
        '@type': 'updateUserStatus',
        user_id: Number(update.userId),
        status: translateUserStatus(update.status),
    };
}

function translateTypingAction(action) {
    if (!action) return { '@type': 'chatActionTyping' };
    const cls = action.className || action._;
    switch (cls) {
        case 'SendMessageTypingAction':
            return { '@type': 'chatActionTyping' };
        case 'SendMessageCancelAction':
            return { '@type': 'chatActionCancel' };
        case 'SendMessageRecordVideoAction':
            return { '@type': 'chatActionRecordingVideo' };
        case 'SendMessageUploadVideoAction':
            return { '@type': 'chatActionUploadingVideo', progress: action.progress || 0 };
        case 'SendMessageRecordAudioAction':
            return { '@type': 'chatActionRecordingVoiceNote' };
        case 'SendMessageUploadAudioAction':
            return { '@type': 'chatActionUploadingVoiceNote', progress: action.progress || 0 };
        case 'SendMessageUploadPhotoAction':
            return { '@type': 'chatActionUploadingPhoto', progress: action.progress || 0 };
        case 'SendMessageUploadDocumentAction':
            return { '@type': 'chatActionUploadingDocument', progress: action.progress || 0 };
        case 'SendMessageGeoLocationAction':
            return { '@type': 'chatActionChoosingLocation' };
        case 'SendMessageChooseContactAction':
            return { '@type': 'chatActionChoosingContact' };
        case 'SendMessageGamePlayAction':
            return { '@type': 'chatActionStartPlayingGame' };
        case 'SendMessageRecordRoundAction':
            return { '@type': 'chatActionRecordingVideoNote' };
        case 'SendMessageUploadRoundAction':
            return { '@type': 'chatActionUploadingVideoNote', progress: action.progress || 0 };
        default:
            return { '@type': 'chatActionTyping' };
    }
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
        user_id: userId,
        sender_id: { '@type': 'messageSenderUser', user_id: userId },
        action: translateTypingAction(update.action),
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
        unread_count: update.stillUnreadCount || 0,
    };
}

function readOutbox(update) {
    let chatId = 0;
    if (update.peer) chatId = peerToTdlibChatId(update.peer);
    else if (update.channelId) chatId = -1000000000000 - Number(update.channelId);

    return {
        '@type': 'updateChatReadOutbox',
        chat_id: chatId,
        last_read_outbox_message_id: update.maxId || 0,
    };
}

function dialogPinned(update) {
    const chatId = peerToTdlibChatId(update.peer?.peer || update.peer);
    if (!chatId) return null;
    return {
        '@type': 'updateChatIsPinned',
        chat_id: chatId,
        is_pinned: !update.unpinned,
        order: update.unpinned ? '0' : '9223372036854775807',
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
                              entities: [],
                          },
                          disable_web_page_preview: false,
                          clear_draft: false,
                      },
                  }
                : null,
        order: '0',
    };
}

function messageReactions(update) {
    const chatId = peerToTdlibChatId(update.peer);
    if (!chatId) return null;
    return {
        '@type': 'updateMessageReactions',
        chat_id: chatId,
        message_id: update.msgId || 0,
        reactions: translateReactions(update.reactions),
    };
}

function chatTitle(update) {
    const chatId = update.chatId ? -Number(update.chatId) : 0;
    if (!chatId) return null;
    return {
        '@type': 'updateChatTitle',
        chat_id: chatId,
        title: update.title || '',
    };
}

function chatPhoto(update) {
    const chatId = update.chatId ? -Number(update.chatId) : 0;
    if (!chatId) return null;
    return {
        '@type': 'updateChatPhoto',
        chat_id: chatId,
        photo: null,
    };
}

function pinnedMessages(update, isChannel) {
    let chatId = 0;
    if (isChannel) {
        chatId = update.channelId ? -1000000000000 - Number(update.channelId) : 0;
    } else {
        chatId = update.peer ? peerToTdlibChatId(update.peer) : 0;
    }
    if (!chatId) return null;
    const messageId = (update.messages || [])[0] || 0;
    return {
        '@type': 'updateChatPinnedMessage',
        chat_id: chatId,
        pinned_message_id: update.pinned ? messageId : 0,
    };
}

function dialogUnreadMark(update) {
    const chatId = peerToTdlibChatId(update.peer?.peer || update.peer);
    if (!chatId) return null;
    return {
        '@type': 'updateChatIsMarkedAsUnread',
        chat_id: chatId,
        is_marked_as_unread: !!update.unread,
    };
}
