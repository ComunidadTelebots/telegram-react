/*
 * Traduce los raw updates de GramJS/MTProto al formato updateXxx que esperan los stores.
 */

import {
    peerToTdlibChatId,
    translateMessage,
    translateUser,
    translateUserStatus,
    translateReactions,
    translateUserProfilePhoto,
    translateStoryContent,
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

        // ── Cambios de usuario ────────────────────────────────────────────────
        case 'UpdateUserName':
            return userName(update);
        case 'UpdateUserPhoto':
            return userPhoto(update);

        // ── Cambios de membresía ──────────────────────────────────────────────
        case 'UpdateChatMember':
            return chatMember(update, false);
        case 'UpdateChannelParticipant':
            return chatMember(update, true);

        // ── Encuestas ────────────────────────────────────────────────────────
        case 'UpdateMessagePoll':
            return messagePoll(update);

        // ── Stories ──────────────────────────────────────────────────────────
        case 'UpdateStory':
            return updateStory(update);
        case 'UpdateReadStories':
            return updateReadStories(update);
        case 'UpdateStoriesStealthMode':
            return updateStoriesStealthMode(update);

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

function userName(update) {
    const userId = Number(update.userId);
    if (!userId) return null;
    const username = update.usernames?.[0]?.username || update.username || '';
    return {
        '@type': 'updateUser',
        user: {
            '@type': 'user',
            id: userId,
            first_name: update.firstName || '',
            last_name: update.lastName || '',
            username,
            phone_number: '',
            status: { '@type': 'userStatusEmpty' },
            type: { '@type': 'userTypeRegular' },
            is_verified: false,
            is_support: false,
            restriction_reason: '',
            have_access: true,
            profile_photo: null,
            language_code: '',
        },
    };
}

function userPhoto(update) {
    const userId = Number(update.userId);
    if (!userId) return null;
    const photoCls = update.photo?.className || update.photo?._;
    const profile_photo =
        photoCls && photoCls !== 'UserProfilePhotoEmpty' ? translateUserProfilePhoto(update.photo, userId) : null;
    return {
        '@type': 'updateUser',
        user: {
            '@type': 'user',
            id: userId,
            first_name: '',
            last_name: '',
            username: '',
            phone_number: '',
            status: { '@type': 'userStatusEmpty' },
            type: { '@type': 'userTypeRegular' },
            is_verified: false,
            is_support: false,
            restriction_reason: '',
            have_access: true,
            profile_photo,
            language_code: '',
        },
    };
}

function translateParticipantStatus(participant) {
    if (!participant) return { '@type': 'chatMemberStatusLeft' };
    const cls = participant.className || participant._;
    switch (cls) {
        case 'ChannelParticipantCreator':
        case 'ChatParticipantCreator':
            return { '@type': 'chatMemberStatusCreator', is_anonymous: false, custom_title: participant.rank || '' };
        case 'ChannelParticipantAdmin':
        case 'ChatParticipantAdmin':
            return {
                '@type': 'chatMemberStatusAdministrator',
                custom_title: participant.rank || '',
                can_be_edited: false,
                can_manage_chat: true,
                can_change_info: true,
                can_post_messages: false,
                can_edit_messages: false,
                can_delete_messages: true,
                can_invite_users: true,
                can_restrict_members: true,
                can_pin_messages: true,
                can_promote_members: false,
                can_manage_video_chats: false,
                is_anonymous: false,
            };
        case 'ChannelParticipantBanned':
            return participant.left
                ? { '@type': 'chatMemberStatusLeft' }
                : { '@type': 'chatMemberStatusBanned', banned_until_date: participant.bannedRights?.untilDate || 0 };
        case 'ChannelParticipantLeft':
            return { '@type': 'chatMemberStatusLeft' };
        default:
            return { '@type': 'chatMemberStatusMember' };
    }
}

function chatMember(update, isChannel) {
    let chatId = 0;
    if (isChannel) {
        chatId = update.channelId ? -1000000000000 - Number(update.channelId) : 0;
    } else {
        chatId = update.chatId ? -Number(update.chatId) : 0;
    }
    if (!chatId) return null;

    const userId = Number(update.userId || update.actorId || 0);
    const actorUserId = Number(update.actorId || 0);

    return {
        '@type': 'updateChatMember',
        chat_id: chatId,
        actor_user_id: actorUserId,
        date: update.date || 0,
        invite_link: null,
        old_chat_member: {
            '@type': 'chatMember',
            user_id: userId,
            inviter_user_id: 0,
            joined_chat_date: 0,
            status: translateParticipantStatus(update.prevParticipant),
        },
        new_chat_member: {
            '@type': 'chatMember',
            user_id: userId,
            inviter_user_id: actorUserId,
            joined_chat_date: update.date || 0,
            status: translateParticipantStatus(update.newParticipant),
        },
    };
}

// ─── Stories ─────────────────────────────────────────────────────────────────

function updateStory(update) {
    const peerId = peerToTdlibChatId(update.peer);
    if (!peerId) return null;
    const story = update.story;
    if (!story) return null;
    const cls = story.className || story._;
    // StoryItemDeleted — la historia fue eliminada
    if (cls === 'StoryItemDeleted') {
        return {
            '@type': 'updateStoryDeleted',
            sender_chat_id: peerId,
            story_id: story.id,
        };
    }
    // StoryItemSkipped o StoryItem
    return {
        '@type': 'updateStory',
        story: translateStoryItem(story, peerId),
    };
}

function updateReadStories(update) {
    const peerId = peerToTdlibChatId(update.peer);
    if (!peerId) return null;
    return {
        '@type': 'updateReadStories',
        sender_chat_id: peerId,
        max_story_id: update.maxId || 0,
    };
}

function updateStoriesStealthMode(update) {
    return {
        '@type': 'updateStoriesStealthMode',
        active_until_date: update.stealthMode?.activeUntilDate || 0,
        cooldown_until_date: update.stealthMode?.cooldownUntilDate || 0,
    };
}

export function translateStoryItem(story, senderChatId) {
    if (!story) return null;
    const cls = story.className || story._;
    if (cls === 'StoryItemDeleted' || cls === 'StoryItemSkipped') return null;

    const content = translateStoryContent(story.media);
    const caption = story.caption
        ? {
              '@type': 'formattedText',
              text: story.caption,
              entities: [],
          }
        : null;

    return {
        '@type': 'story',
        id: story.id,
        sender_chat_id: senderChatId,
        date: story.date || 0,
        expire_date: story.expireDate || 0,
        content,
        caption,
        is_read: !!story.seen,
        privacy_settings: null,
    };
}

function messagePoll(update) {
    if (!update.poll) return null;
    const poll = update.poll;
    const totalVoters = update.results?.totalVoters || 0;
    const voterMap = new Map();
    for (const r of update.results?.results || []) {
        const key = r.option ? Buffer.from(r.option).toString('hex') : '';
        voterMap.set(key, { voters: r.voters || 0, chosen: !!r.chosen });
    }
    const options = (poll.answers || []).map(a => {
        const key = a.option ? Buffer.from(a.option).toString('hex') : '';
        const rv = voterMap.get(key) || { voters: 0, chosen: false };
        const pct = totalVoters > 0 ? Math.round((rv.voters / totalVoters) * 100) : 0;
        const answerText = typeof a.text === 'string' ? a.text : a.text?.text || '';
        return {
            '@type': 'pollOption',
            text: answerText,
            text_entities: [],
            voter_count: rv.voters,
            vote_percentage: pct,
            is_chosen: rv.chosen,
            is_being_chosen: false,
            _option_data: a.option ? Array.from(a.option) : [],
        };
    });
    return {
        '@type': 'updatePoll',
        poll: {
            '@type': 'poll',
            id: String(poll.id),
            question: typeof poll.question === 'string' ? poll.question : poll.question?.text || '',
            options,
            total_voter_count: totalVoters,
            is_anonymous: poll.publicVoters === false,
            type: poll.quiz
                ? { '@type': 'pollTypeQuiz', correct_option_id: update.results?.correct || 0 }
                : { '@type': 'pollTypeRegular', allow_multiple_answers: !!poll.multipleChoice },
            open_period: poll.closePeriod || 0,
            close_date: poll.closeDate || 0,
            is_closed: !!poll.closed,
        },
    };
}
