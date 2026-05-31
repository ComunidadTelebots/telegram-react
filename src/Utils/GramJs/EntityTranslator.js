/* global BigInt */
/*
 * Traduce entidades GramJS/MTProto al formato que esperan los stores de TDLib.
 */

// ─── ID helpers ─────────────────────────────────────────────────────────────

export function peerToTdlibChatId(peer) {
    if (!peer) return 0;
    const cls = peer.className || peer._;
    if (cls === 'PeerUser' || peer.userId !== undefined) return Number(peer.userId);
    if (cls === 'PeerChat' || peer.chatId !== undefined) return -Number(peer.chatId);
    if (cls === 'PeerChannel' || peer.channelId !== undefined) return -1000000000000 - Number(peer.channelId);
    return 0;
}

export function entityToTdlibChatId(entity) {
    if (!entity) return 0;
    const cls = entity.className || entity._;
    if (cls === 'User') return Number(entity.id);
    if (cls === 'Chat' || cls === 'ChatForbidden') return -Number(entity.id);
    if (cls === 'Channel' || cls === 'ChannelForbidden') return -1000000000000 - Number(entity.id);
    return 0;
}

/** Convierte un TDLib chat_id al InputPeer de GramJS usando la caché de entidades. */
export function tdlibChatIdToInputPeer(chatId, entityCache) {
    const { Api } = require('telegram');
    if (chatId > 0) {
        const u = entityCache.get(chatId);
        return new Api.InputPeerUser({ userId: BigInt(chatId), accessHash: u?.accessHash || BigInt(0) });
    }
    if (chatId > -1000000000000) {
        return new Api.InputPeerChat({ chatId: BigInt(-chatId) });
    }
    const channelId = BigInt(-chatId - 1000000000000);
    const ch = entityCache.get(chatId);
    return new Api.InputPeerChannel({ channelId, accessHash: ch?.accessHash || BigInt(0) });
}

// ─── Media helpers ───────────────────────────────────────────────────────────

export const mediaCache = new Map();

function translateFile(id, size = 0, remoteId = '') {
    const fileId = typeof id === 'bigint' ? Number(id) : Number(id || 0);
    return {
        '@type': 'file',
        id: fileId,
        size: size || 0,
        expected_size: size || 0,
        local: {
            '@type': 'localFile',
            path: '',
            can_be_downloaded: true,
            can_be_deleted: false,
            is_downloading_active: false,
            is_downloading_completed: false,
            downloaded_prefix_size: 0,
            downloaded_size: 0,
        },
        remote: {
            '@type': 'remoteFile',
            id: remoteId || String(fileId),
            unique_id: remoteId || String(fileId),
            is_uploading_active: false,
            is_uploading_completed: true,
            uploaded_size: size || 0,
        },
    };
}

function getProfilePhotoFileId(chatId, isBig = false) {
    const safeId = Math.abs(Number(chatId || 0));
    return -7000000000000000 + safeId * 2 + (isBig ? 1 : 0);
}

function translateProfilePhoto(entity, chatId) {
    const photo = entity?.photo;
    const cls = photo?.className || photo?._;
    if (!photo || cls === 'UserProfilePhotoEmpty' || cls === 'ChatPhotoEmpty') return null;

    const smallId = getProfilePhotoFileId(chatId, false);
    const bigId = getProfilePhotoFileId(chatId, true);
    mediaCache.set(smallId, { '@type': 'profilePhoto', entity, isBig: false });
    mediaCache.set(bigId, { '@type': 'profilePhoto', entity, isBig: true });

    return {
        '@type': 'profilePhoto',
        id: String(photo.photoId || chatId),
        small: translateFile(smallId, 0, String(smallId)),
        big: translateFile(bigId, 0, String(bigId)),
    };
}

export function translatePhoto(gPhoto) {
    if (!gPhoto) return null;
    const photoCls = gPhoto.className || gPhoto._;
    if (photoCls === 'PhotoEmpty') return null;
    if (gPhoto.id) {
        mediaCache.set(Number(gPhoto.id), gPhoto);
    }
    const sizes = (gPhoto.sizes || [])
        .filter(sz => {
            const szCls = sz.className || sz._;
            // Skip stripped (minithumbnail bytes), empty, and path sizes — not downloadable
            return (
                szCls !== 'PhotoSizeEmpty' &&
                szCls !== 'PhotoStrippedSize' &&
                szCls !== 'PhotoPathSize' &&
                (sz.w || sz.width)
            );
        })
        .map(sz => {
            const type = sz.type || 'x';
            const w = sz.w || sz.width || 320;
            const h = sz.h || sz.height || 240;
            const szBytes = sz.size || 10000;
            return {
                '@type': 'photoSize',
                type,
                width: Number(w),
                height: Number(h),
                photo: translateFile(gPhoto.id, szBytes, gPhoto.id ? String(gPhoto.id) : ''),
            };
        })
        .filter(Boolean);

    if (sizes.length === 0) {
        sizes.push({
            '@type': 'photoSize',
            type: 'x',
            width: 320,
            height: 240,
            photo: translateFile(gPhoto.id || 0, 10000, ''),
        });
    }

    return {
        '@type': 'photo',
        has_stickers: false,
        minithumbnail: null,
        sizes,
    };
}

export function translateDocument(gDoc) {
    if (!gDoc) return null;
    if (gDoc.id) {
        mediaCache.set(Number(gDoc.id), gDoc);
    }
    const size = gDoc.size ? Number(gDoc.size) : 0;
    const mimeType = gDoc.mimeType || 'application/octet-stream';
    const fileNameAttr = (gDoc.attributes || []).find(a => (a.className || a._) === 'DocumentAttributeFilename');
    const fileName = fileNameAttr?.fileName || 'document';

    return {
        '@type': 'document',
        file_name: fileName,
        mime_type: mimeType,
        minithumbnail: null,
        thumbnail: null,
        document: translateFile(gDoc.id, size, gDoc.id ? String(gDoc.id) : ''),
    };
}

export function translateAnimation(gDoc) {
    if (!gDoc) return null;
    if (gDoc.id) {
        mediaCache.set(Number(gDoc.id), gDoc);
    }
    const size = gDoc.size ? Number(gDoc.size) : 0;
    const mimeType = gDoc.mimeType || 'video/mp4';

    const videoAttr = (gDoc.attributes || []).find(a => (a.className || a._) === 'DocumentAttributeVideo');
    const width = videoAttr?.w || 320;
    const height = videoAttr?.h || 240;
    const duration = videoAttr?.duration || 0;

    return {
        '@type': 'animation',
        duration: Number(duration),
        width: Number(width),
        height: Number(height),
        file_name: 'animation.mp4',
        mime_type: mimeType,
        has_stickers: false,
        minithumbnail: null,
        thumbnail: null,
        animation: translateFile(gDoc.id, size, gDoc.id ? String(gDoc.id) : ''),
    };
}

export function translateVideo(gDoc) {
    if (!gDoc) return null;
    if (gDoc.id) {
        mediaCache.set(Number(gDoc.id), gDoc);
    }
    const size = gDoc.size ? Number(gDoc.size) : 0;
    const mimeType = gDoc.mimeType || 'video/mp4';

    const videoAttr = (gDoc.attributes || []).find(a => (a.className || a._) === 'DocumentAttributeVideo');
    const width = videoAttr?.w || 320;
    const height = videoAttr?.h || 240;
    const duration = videoAttr?.duration || 0;

    return {
        '@type': 'video',
        duration: Number(duration),
        width: Number(width),
        height: Number(height),
        file_name: 'video.mp4',
        mime_type: mimeType,
        has_stickers: false,
        minithumbnail: null,
        thumbnail: null,
        video: translateFile(gDoc.id, size, gDoc.id ? String(gDoc.id) : ''),
    };
}

export function translateAudio(gDoc) {
    if (!gDoc) return null;
    if (gDoc.id) {
        mediaCache.set(Number(gDoc.id), gDoc);
    }
    const size = gDoc.size ? Number(gDoc.size) : 0;
    const mimeType = gDoc.mimeType || 'audio/mpeg';

    const audioAttr = (gDoc.attributes || []).find(a => (a.className || a._) === 'DocumentAttributeAudio');
    const duration = audioAttr?.duration || 0;
    const title = audioAttr?.title || '';
    const performer = audioAttr?.performer || '';

    return {
        '@type': 'audio',
        duration: Number(duration),
        title,
        performer,
        mime_type: mimeType,
        album_cover_minithumbnail: null,
        album_cover_thumbnail: null,
        audio: translateFile(gDoc.id, size, gDoc.id ? String(gDoc.id) : ''),
    };
}

export function translateSticker(gDoc) {
    if (!gDoc) return null;
    if (gDoc.id) {
        mediaCache.set(Number(gDoc.id), gDoc);
    }
    const size = gDoc.size ? Number(gDoc.size) : 0;
    const mimeType = gDoc.mimeType || '';
    const isAnimated = mimeType === 'application/x-tgsticker';
    const isVideo = mimeType === 'video/webm';

    const stickerAttr = (gDoc.attributes || []).find(a => (a.className || a._) === 'DocumentAttributeSticker');
    const customEmojiAttr = (gDoc.attributes || []).find(a => (a.className || a._) === 'DocumentAttributeCustomEmoji');
    const alt = stickerAttr?.alt || customEmojiAttr?.alt || '';
    const setId = stickerAttr?.stickerset?.id ? String(stickerAttr.stickerset.id) : '0';
    const isCustomEmoji = Boolean(customEmojiAttr);

    const imgAttr = (gDoc.attributes || []).find(a => (a.className || a._) === 'DocumentAttributeImageSize');
    const videoAttrS = (gDoc.attributes || []).find(a => (a.className || a._) === 'DocumentAttributeVideo');
    const width = imgAttr?.w || videoAttrS?.w || 512;
    const height = imgAttr?.h || videoAttrS?.h || 512;

    const validThumb = (gDoc.thumbs || []).find(t => {
        const tc = t.className || t._;
        return tc !== 'PhotoStrippedSize' && tc !== 'PhotoSizeEmpty' && tc !== 'PhotoPathSize' && (t.w || t.h);
    });
    const thumbnail = validThumb
        ? {
              '@type': 'thumbnail',
              format: { '@type': 'thumbnailFormatJpeg' },
              width: Number(validThumb.w || validThumb.width || 100),
              height: Number(validThumb.h || validThumb.height || 100),
              file: translateFile(gDoc.id, validThumb.size || 0, gDoc.id ? String(gDoc.id) : ''),
          }
        : null;

    return {
        '@type': 'sticker',
        set_id: setId,
        width: Number(width),
        height: Number(height),
        emoji: alt,
        is_animated: isAnimated,
        is_video: isVideo,
        is_custom_emoji: isCustomEmoji,
        thumbnail,
        sticker: translateFile(gDoc.id, size, gDoc.id ? String(gDoc.id) : ''),
    };
}

export function translateStickerSetInfo(ss) {
    if (!ss) return null;
    return {
        '@type': 'stickerSetInfo',
        id: String(ss.id),
        title: ss.title || '',
        name: ss.shortName || '',
        thumbnail: null,
        is_installed: !ss.archived,
        is_archived: !!ss.archived,
        is_official: !!ss.official,
        is_animated: !!ss.animated,
        is_masks: !!ss.masks,
        is_viewed: true,
        size: ss.count || 0,
        covers: [],
    };
}

export function translateStickerSet(result) {
    if (!result || !result.set) return null;
    const { set, packs, documents } = result;

    // Build emoji map: document_id (string) → emoji
    const emojiMap = new Map();
    for (const pack of packs || []) {
        const emoji = pack.emoticon || '';
        for (const docId of pack.documents || []) {
            const key = String(docId);
            if (!emojiMap.has(key)) emojiMap.set(key, emoji);
        }
    }

    const stickers = (documents || [])
        .map(doc => {
            const s = translateSticker(doc);
            if (!s) return null;
            const emoji = emojiMap.get(String(doc.id)) || s.emoji || '';
            return { ...s, emoji, set_id: String(set.id) };
        })
        .filter(Boolean);

    return {
        '@type': 'stickerSet',
        id: String(set.id),
        title: set.title || '',
        name: set.shortName || '',
        thumbnail: null,
        is_installed: !set.archived,
        is_archived: !!set.archived,
        is_official: !!set.official,
        is_animated: !!set.animated,
        is_masks: !!set.masks,
        is_viewed: true,
        stickers,
        emojis: stickers.map(s => ({ '@type': 'emojis', emojis: s.emoji ? [s.emoji] : [] })),
    };
}

// ─── User ────────────────────────────────────────────────────────────────────

export function translateUser(user) {
    if (!user) return null;
    const userId = Number(user.id);
    return {
        '@type': 'user',
        id: userId,
        first_name: user.firstName || '',
        last_name: user.lastName || '',
        username: user.username || '',
        phone_number: user.phone || '',
        status: translateUserStatus(user.status),
        type: user.bot
            ? {
                  '@type': 'userTypeBot',
                  can_join_groups: !!user.botChatHistory,
                  can_read_all_group_messages: false,
                  is_inline: !!user.botInlineGeo,
                  inline_query_placeholder: '',
                  need_location: false,
              }
            : { '@type': 'userTypeRegular' },
        is_verified: !!user.verified,
        is_support: !!user.support,
        restriction_reason: user.restrictionReason?.[0]?.text || '',
        have_access: true,
        profile_photo: translateProfilePhoto(user, userId),
        language_code: '',
    };
}

export function translateUserStatus(status) {
    if (!status) return { '@type': 'userStatusEmpty' };
    const cls = status.className || status._;
    switch (cls) {
        case 'UserStatusOnline':
            return { '@type': 'userStatusOnline', expires: status.expires || 0 };
        case 'UserStatusOffline':
            return { '@type': 'userStatusOffline', was_online: status.wasOnline || 0 };
        case 'UserStatusRecently':
            return { '@type': 'userStatusRecently' };
        case 'UserStatusLastWeek':
            return { '@type': 'userStatusLastWeek' };
        case 'UserStatusLastMonth':
            return { '@type': 'userStatusLastMonth' };
        default:
            return { '@type': 'userStatusEmpty' };
    }
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export function translateChat(entity, dialog) {
    if (!entity) return null;
    const cls = entity.className || entity._;
    const chatId = entityToTdlibChatId(entity);
    let type, title;

    if (cls === 'User') {
        type = { '@type': 'chatTypePrivate', user_id: Number(entity.id) };
        title = [entity.firstName, entity.lastName].filter(Boolean).join(' ') || entity.username || String(entity.id);
    } else if (cls === 'Chat' || cls === 'ChatForbidden') {
        type = { '@type': 'chatTypeBasicGroup', basic_group_id: Number(entity.id) };
        title = entity.title || '';
    } else if (cls === 'Channel' || cls === 'ChannelForbidden') {
        type = entity.megagroup
            ? { '@type': 'chatTypeSupergroup', supergroup_id: Number(entity.id), is_channel: false }
            : { '@type': 'chatTypeSupergroup', supergroup_id: Number(entity.id), is_channel: true };
        title = entity.title || '';
    } else {
        return null;
    }

    const lastMsg = dialog?.message ? translateMessage(dialog.message, chatId) : null;
    const photo = translateProfilePhoto(entity, chatId);

    // El order determina la posición en la lista; usamos date × 1000 para ordenar por recencia.
    const date = dialog?.date || 0;
    const pinned = dialog?.pinned || false;
    const order = pinned ? '9223372036854775807' : String(date * 1000);

    // Notification settings from dialog
    const ns = dialog?.notifySettings;
    const muteUntil = ns?.muteUntil || 0;
    const now = Math.floor(Date.now() / 1000);
    const isMuted = muteUntil > now || muteUntil === -1 || muteUntil === 2147483647;
    const muteFor = isMuted ? (muteUntil === 2147483647 || muteUntil === -1 ? 2147483647 : muteUntil - now) : 0;
    const showPreviews = ns?.showPreviews ?? null;

    // Draft message
    let draftMessage = null;
    const draftObj = dialog?.draft;
    const draftCls = draftObj?.className || draftObj?._;
    if (draftCls === 'DraftMessage' && draftObj.message) {
        draftMessage = {
            '@type': 'draftMessage',
            reply_to_message_id: draftObj.replyToMsgId || 0,
            date: draftObj.date || 0,
            input_message_text: {
                '@type': 'inputMessageText',
                text: { '@type': 'formattedText', text: draftObj.message, entities: [] },
                disable_web_page_preview: false,
                clear_draft: false,
            },
        };
    }

    return {
        '@type': 'chat',
        id: chatId,
        type,
        title,
        photo,
        last_message: lastMsg,
        order,
        is_pinned: pinned,
        is_marked_as_unread: !!dialog?.unreadMark,
        is_sponsored: false,
        can_be_deleted_only_for_self: true,
        can_be_deleted_for_all_users: false,
        can_be_reported: false,
        default_disable_notification: isMuted,
        unread_count: dialog?.unreadCount || 0,
        last_read_inbox_message_id: dialog?.readInboxMaxId || 0,
        last_read_outbox_message_id: dialog?.readOutboxMaxId || 0,
        unread_mention_count: dialog?.unreadMentionsCount || 0,
        notification_settings: {
            '@type': 'chatNotificationSettings',
            use_default_mute_for: muteFor === 0,
            mute_for: muteFor,
            use_default_sound: true,
            sound: 'default',
            use_default_show_preview: showPreviews === null,
            show_preview: showPreviews ?? true,
            use_default_disable_pinned_message_notifications: true,
            disable_pinned_message_notifications: false,
            use_default_disable_mention_notifications: true,
            disable_mention_notifications: false,
        },
        pinned_message_id: dialog?.pinnedMsgId || 0,
        reply_markup_message_id: dialog?.replyMarkupMsgId || 0,
        draft_message: draftMessage,
        client_data: '',
    };
}

// ─── Message ──────────────────────────────────────────────────────────────────

function translateForwardInfo(fwdFrom) {
    if (!fwdFrom) return null;

    let origin;
    if (fwdFrom.fromId) {
        const fc = fwdFrom.fromId.className || fwdFrom.fromId._;
        if (fc === 'PeerUser') {
            origin = { '@type': 'messageForwardOriginUser', sender_user_id: Number(fwdFrom.fromId.userId) };
        } else if (fc === 'PeerChannel') {
            const chatId = -1000000000000 - Number(fwdFrom.fromId.channelId);
            origin = {
                '@type': 'messageForwardOriginChannel',
                chat_id: chatId,
                message_id: fwdFrom.channelPost || 0,
                author_signature: fwdFrom.postAuthor || '',
            };
        } else if (fc === 'PeerChat') {
            origin = { '@type': 'messageForwardOriginUser', sender_user_id: 0 };
        }
    }

    if (!origin) {
        origin = {
            '@type': 'messageForwardOriginHiddenUser',
            sender_name: fwdFrom.fromName || 'Unknown',
        };
    }

    return {
        '@type': 'messageForwardInfo',
        origin,
        date: fwdFrom.date || 0,
        public_service_announcement_type: fwdFrom.psaType || '',
        from_chat_id: 0,
        from_message_id: 0,
    };
}

function translateServiceContent(action) {
    const cls = action?.className || action?._;
    if (!cls) return null;

    if (cls === 'MessageActionChatAddUser' || cls === 'MessageActionChatJoinedByRequest') {
        const members = (action.users || []).map(id => Number(id));
        return {
            '@type': 'messageChatAddMembers',
            member_user_ids: members.length ? members : [0],
        };
    }
    if (cls === 'MessageActionChatJoinedByLink') {
        return { '@type': 'messageChatJoinByLink' };
    }
    if (cls === 'MessageActionChatDeleteUser') {
        return { '@type': 'messageChatDeleteMember', user_id: Number(action.userId || 0) };
    }
    if (cls === 'MessageActionChatCreate') {
        return { '@type': 'messageBasicGroupChatCreate', title: action.title || '', member_user_ids: [] };
    }
    if (cls === 'MessageActionChannelCreate') {
        return { '@type': 'messageSupergroupChatCreate', title: action.title || '' };
    }
    if (cls === 'MessageActionChatEditTitle') {
        return { '@type': 'messageChatChangeTitle', title: action.title || '' };
    }
    if (cls === 'MessageActionChatEditPhoto') {
        return { '@type': 'messageChatChangePhoto', photo: null };
    }
    if (cls === 'MessageActionChatDeletePhoto') {
        return { '@type': 'messageChatDeletePhoto' };
    }
    if (cls === 'MessageActionPinMessage') {
        return { '@type': 'messagePinMessage', message_id: action.msgId || 0 };
    }
    if (cls === 'MessageActionHistoryClear') {
        return { '@type': 'messageChatDeleteHistory' };
    }
    if (cls === 'MessageActionContactSignUp') {
        return { '@type': 'messageContactRegistered' };
    }
    if (cls === 'MessageActionPhoneCall') {
        const reasonCls = action.reason?.className || action.reason?._ || '';
        let discard_reason;
        if (reasonCls === 'PhoneCallDiscardReasonMissed') {
            discard_reason = { '@type': 'callDiscardReasonMissed' };
        } else if (reasonCls === 'PhoneCallDiscardReasonBusy') {
            discard_reason = { '@type': 'callDiscardReasonDeclined' };
        } else {
            discard_reason = { '@type': 'callDiscardReasonEmpty' };
        }
        return {
            '@type': 'messageCall',
            is_video: !!action.video,
            discard_reason,
            duration: action.duration || 0,
        };
    }
    if (cls === 'MessageActionGameScore') {
        return {
            '@type': 'messageGameScore',
            game_message_id: action.gameId ? Number(action.gameId) : 0,
            game_id: action.gameId ? String(action.gameId) : '0',
            score: action.score || 0,
        };
    }
    if (cls === 'MessageActionChatMigrateTo') {
        return { '@type': 'messageChatUpgradeTo', supergroup_id: action.channelId ? Number(action.channelId) : 0 };
    }
    if (cls === 'MessageActionChannelMigrateFrom') {
        return {
            '@type': 'messageChatUpgradeFrom',
            title: action.title || '',
            basic_group_id: action.chatId ? Number(action.chatId) : 0,
        };
    }
    if (cls === 'MessageActionChatSetTtl' || cls === 'MessageActionChatSetMessagesTtl') {
        return { '@type': 'messageChatSetTtl', ttl: action.period || 0 };
    }
    if (cls === 'MessageActionScreenshotTaken') {
        return { '@type': 'messageScreenshotTaken' };
    }
    if (cls === 'MessageActionCustomAction') {
        return { '@type': 'messageCustomServiceAction', text: action.message || '' };
    }
    if (cls === 'MessageActionBotAllowed') {
        return { '@type': 'messageWebsiteConnected', domain_name: action.domain || '' };
    }
    if (cls === 'MessageActionGeoProximityReached') {
        return {
            '@type': 'messageProximityAlertTriggered',
            traveler_id: action.fromId?.userId ? Number(action.fromId.userId) : 0,
            watcher_id: action.toId?.userId ? Number(action.toId.userId) : 0,
            distance: action.distance || 0,
        };
    }
    if (cls === 'MessageActionGroupCall') {
        const dur = action.duration;
        const text = dur ? `Group call ended (${dur}s)` : 'Group call started';
        return { '@type': 'messageCustomServiceAction', text };
    }
    if (cls === 'MessageActionInviteToGroupCall') {
        return { '@type': 'messageCustomServiceAction', text: 'Invited to video call' };
    }
    if (cls === 'MessageActionSetChatTheme') {
        const emoticon = action.emoticon || '';
        return {
            '@type': 'messageCustomServiceAction',
            text: emoticon ? `Chat theme changed to ${emoticon}` : 'Chat theme removed',
        };
    }
    if (cls === 'MessageActionTopicCreate') {
        return { '@type': 'messageCustomServiceAction', text: `Topic «${action.title || ''}» created` };
    }
    if (cls === 'MessageActionTopicEdit') {
        const title = action.title;
        return { '@type': 'messageCustomServiceAction', text: title ? `Topic renamed to «${title}»` : 'Topic edited' };
    }
    if (cls === 'MessageActionBoostApply') {
        const n = action.boosts || 1;
        return { '@type': 'messageCustomServiceAction', text: n === 1 ? '1 boost applied' : `${n} boosts applied` };
    }
    if (cls === 'MessageActionPaymentSent') {
        const cur = action.currency || '';
        const amt = action.totalAmount ? Number(action.totalAmount) : 0;
        return { '@type': 'messageCustomServiceAction', text: `Payment of ${(amt / 100).toFixed(2)} ${cur} sent` };
    }
    if (cls === 'MessageActionPaymentSentMe') {
        return { '@type': 'messagePaymentSuccessfulBot' };
    }
    if (cls === 'MessageActionWebViewDataSent' || cls === 'MessageActionWebViewDataSentMe') {
        return { '@type': 'messageCustomServiceAction', text: `Data sent via ${action.text || 'web app'}` };
    }
    if (cls === 'MessageActionRequestedPeer' || cls === 'MessageActionRequestedPeerSentMe') {
        return { '@type': 'messageCustomServiceAction', text: 'Peer shared' };
    }
    return null;
}

export function translateMessage(msg, chatId) {
    if (!msg) return null;
    const cls = msg.className || msg._;
    if (cls === 'MessageEmpty' || cls === 'messageEmpty') return null;

    const content = translateMessageContent(msg);
    if (!content) return null;

    let sender_id;
    let sender_user_id = 0;
    if (msg.fromId) {
        const fc = msg.fromId.className || msg.fromId._;
        if (fc === 'PeerUser') {
            sender_user_id = Number(msg.fromId.userId);
            sender_id = { '@type': 'messageSenderUser', user_id: sender_user_id };
        } else if (fc === 'PeerChannel') {
            sender_id = { '@type': 'messageSenderChat', chat_id: -1000000000000 - Number(msg.fromId.channelId) };
        }
    }
    if (!sender_id) {
        sender_id = { '@type': 'messageSenderChat', chat_id: chatId };
    }

    return {
        '@type': 'message',
        id: msg.id,
        sender_id,
        sender_user_id,
        chat_id: chatId,
        is_outgoing: !!msg.out,
        is_pinned: !!msg.pinned,
        can_be_edited: !!msg.out,
        can_be_forwarded: true,
        can_be_deleted_only_for_self: true,
        can_be_deleted_for_all_users: !!msg.out,
        is_channel_post: !msg.fromId,
        contains_unread_mention: !!msg.mentioned,
        date: msg.date || 0,
        edit_date: msg.editDate || 0,
        views: msg.views || 0,
        forward_info: translateForwardInfo(msg.fwdFrom),
        interaction_info: msg.views
            ? {
                  '@type': 'messageInteractionInfo',
                  view_count: msg.views || 0,
                  forward_count: msg.forwards || 0,
                  reply_info: null,
              }
            : null,
        reply_to_message_id: msg.replyTo ? msg.replyTo.replyToMsgId || 0 : 0,
        reply_to: msg.replyTo
            ? { '@type': 'messageReplyToMessage', chat_id: chatId, message_id: msg.replyTo.replyToMsgId || 0 }
            : null,
        content,
        reply_markup: null,
        author_signature: msg.postAuthor || '',
        media_album_id: msg.groupedId ? String(msg.groupedId) : '0',
        restriction_reason: '',
        ttl: 0,
        ttl_expires_in: 0,
        via_bot_user_id: msg.viaBotId ? Number(msg.viaBotId) : 0,
        reactions: translateReactions(msg.reactions),
    };
}

export function translateUserProfilePhoto(gPhoto) {
    if (!gPhoto) return null;
    const cls = gPhoto.className || gPhoto._;
    if (cls === 'PhotoEmpty') return null;

    const fileId = Number(gPhoto.id);
    mediaCache.set(fileId, gPhoto);

    const makeFile = sz => {
        const bytes = sz.size || (sz.bytes ? sz.bytes.length : 0) || 10000;
        return {
            '@type': 'file',
            id: fileId,
            size: bytes,
            expected_size: bytes,
            local: {
                '@type': 'localFile',
                path: '',
                can_be_downloaded: true,
                can_be_deleted: false,
                is_downloading_active: false,
                is_downloading_completed: false,
                downloaded_prefix_size: 0,
                downloaded_size: 0,
            },
            remote: {
                '@type': 'remoteFile',
                id: String(fileId),
                unique_id: String(gPhoto.id),
                is_uploading_active: false,
                is_uploading_completed: true,
                uploaded_size: bytes,
            },
        };
    };

    const sizes = (gPhoto.sizes || [])
        .filter(sz => sz.w || sz.width)
        .map(sz => ({
            '@type': 'photoSize',
            type: sz.type || 'x',
            width: Number(sz.w || sz.width || 0),
            height: Number(sz.h || sz.height || 0),
            photo: makeFile(sz),
        }));

    if (sizes.length === 0) {
        sizes.push({ '@type': 'photoSize', type: 'x', width: 640, height: 640, photo: makeFile({}) });
    }

    return { '@type': 'userProfilePhoto', id: String(gPhoto.id), sizes, added_date: gPhoto.date || 0 };
}

export function translateReactions(raw) {
    if (!raw || !raw.results || raw.results.length === 0) return null;
    return {
        '@type': 'messageReactions',
        reactions: raw.results
            .filter(r => r.reaction && (r.reaction.emoticon || r.reaction._ === 'reactionEmoji'))
            .map(r => ({
                '@type': 'messageReaction',
                reaction: r.reaction.emoticon || '',
                total_count: r.count || 0,
                is_chosen: r.chosenOrder != null,
            })),
    };
}

function makeCaption(msg) {
    return {
        '@type': 'formattedText',
        text: msg.message || '',
        entities: (msg.entities || []).map(translateTextEntity).filter(Boolean),
    };
}

function translateMessageContent(msg) {
    const msgCls = msg.className || msg._;

    // Service messages (group join, pin, etc.)
    if (msgCls === 'MessageService') {
        return translateServiceContent(msg.action) || { '@type': 'messageUnsupported' };
    }

    const media = msg.media;
    const mediaClass = media?.className || media?._;

    // Texto puro / sin media / no soportado explícitamente
    if (
        !media ||
        mediaClass === 'MessageMediaEmpty' ||
        mediaClass === 'messageMediaEmpty' ||
        mediaClass === 'MessageMediaUnsupported' ||
        mediaClass === 'messageMediaUnsupported'
    ) {
        return {
            '@type': 'messageText',
            text: {
                '@type': 'formattedText',
                text: msg.message || '',
                entities: (msg.entities || []).map(translateTextEntity).filter(Boolean),
            },
            web_page: null,
        };
    }

    // Foto
    if (mediaClass === 'MessageMediaPhoto' || mediaClass === 'messageMediaPhoto') {
        const photo = translatePhoto(media.photo);
        if (!photo) return { '@type': 'messageUnsupported' };
        return {
            '@type': 'messagePhoto',
            photo,
            caption: makeCaption(msg),
            is_secret: !!media.ttlSeconds,
        };
    }

    // Documento / sticker / audio / video
    if (mediaClass === 'MessageMediaDocument' || mediaClass === 'messageMediaDocument') {
        const doc = media.document;
        if (!doc || !doc.id) return { '@type': 'messageUnsupported' };
        const attrs = doc?.attributes || [];
        const isSticker = attrs.some(a => (a.className || a._) === 'DocumentAttributeSticker');
        const audioAttr = attrs.find(a => (a.className || a._) === 'DocumentAttributeAudio');
        const isAudio = !!audioAttr;
        const isVoice = isAudio && !!audioAttr.voice;
        const videoAttr = attrs.find(a => (a.className || a._) === 'DocumentAttributeVideo');
        const isVideo = !!videoAttr;
        const isVideoNote = isVideo && !!videoAttr.roundMessage;
        const isAnim = attrs.some(a => (a.className || a._) === 'DocumentAttributeAnimated');

        if (isSticker) return { '@type': 'messageSticker', sticker: translateSticker(doc) };
        if (isAnim)
            return {
                '@type': 'messageAnimation',
                animation: translateAnimation(doc),
                caption: makeCaption(msg),
                is_secret: false,
            };
        if (isVideoNote) {
            if (doc?.id) mediaCache.set(Number(doc.id), doc);
            const dur = videoAttr?.duration || 0;
            const wh = videoAttr?.w || 240;
            return {
                '@type': 'messageVideoNote',
                video_note: {
                    '@type': 'videoNote',
                    duration: Number(dur),
                    length: Number(wh),
                    minithumbnail: null,
                    thumbnail: null,
                    video: translateFile(doc.id, doc.size ? Number(doc.size) : 0, doc.id ? String(doc.id) : ''),
                },
                is_viewed: false,
                is_secret: false,
            };
        }
        if (isVideo)
            return {
                '@type': 'messageVideo',
                video: translateVideo(doc),
                caption: makeCaption(msg),
                is_secret: false,
            };
        if (isVoice) {
            if (doc?.id) mediaCache.set(Number(doc.id), doc);
            const size = doc.size ? Number(doc.size) : 0;
            const waveformAttr = audioAttr.waveform;
            return {
                '@type': 'messageVoiceNote',
                voice_note: {
                    '@type': 'voiceNote',
                    duration: Number(audioAttr.duration || 0),
                    waveform: waveformAttr || '',
                    mime_type: doc.mimeType || 'audio/ogg',
                    voice: translateFile(doc.id, size, doc.id ? String(doc.id) : ''),
                },
                is_listened: false,
            };
        }
        if (isAudio)
            return {
                '@type': 'messageAudio',
                audio: translateAudio(doc),
                caption: makeCaption(msg),
            };

        return {
            '@type': 'messageDocument',
            document: translateDocument(doc),
            caption: makeCaption(msg),
        };
    }

    // Contacto
    if (mediaClass === 'MessageMediaContact' || mediaClass === 'messageMediaContact') {
        return {
            '@type': 'messageContact',
            contact: {
                '@type': 'contact',
                phone_number: media.phoneNumber || '',
                first_name: media.firstName || '',
                last_name: media.lastName || '',
                vcard: '',
                user_id: media.userId ? Number(media.userId) : 0,
            },
        };
    }

    // Web page preview
    if (mediaClass === 'MessageMediaWebPage' || mediaClass === 'messageMediaWebPage') {
        const wp = media.webpage;
        const wpCls = wp?.className || wp?._;
        const webPage =
            wpCls === 'WebPage'
                ? {
                      '@type': 'webPage',
                      url: wp.url || '',
                      display_url: wp.displayUrl || wp.url || '',
                      type: wp.type || '',
                      site_name: wp.siteName || '',
                      title: typeof wp.title === 'string' ? wp.title : wp.title?.text || '',
                      description: typeof wp.description === 'string' ? wp.description : wp.description?.text || null,
                      photo: wp.photo ? translatePhoto(wp.photo) : null,
                      embed_url: wp.embedUrl || '',
                      embed_type: wp.embedType || '',
                      embed_width: Number(wp.embedWidth || 0),
                      embed_height: Number(wp.embedHeight || 0),
                      duration: Number(wp.duration || 0),
                      author: wp.author || '',
                      document: null,
                      instant_view_version: wp.cachedPage ? 2 : 0,
                  }
                : null;
        return {
            '@type': 'messageText',
            text: {
                '@type': 'formattedText',
                text: msg.message || '',
                entities: (msg.entities || []).map(translateTextEntity).filter(Boolean),
            },
            web_page: webPage,
        };
    }

    // Poll
    if (mediaClass === 'MessageMediaPoll' || mediaClass === 'messageMediaPoll') {
        const poll = media.poll;
        return {
            '@type': 'messagePoll',
            poll: {
                '@type': 'poll',
                id: poll ? String(poll.id) : '0',
                question: typeof poll?.question === 'string' ? poll.question : poll?.question?.text || '',
                options: (() => {
                    const totalVoters = media.results?.totalVoters || 0;
                    const voterMap = new Map();
                    for (const r of media.results?.results || []) {
                        const key = r.option ? Buffer.from(r.option).toString('hex') : '';
                        voterMap.set(key, { voters: r.voters || 0, chosen: !!r.chosen });
                    }
                    return (poll?.answers || []).map(a => {
                        const key = a.option ? Buffer.from(a.option).toString('hex') : '';
                        const rv = voterMap.get(key) || { voters: 0, chosen: false };
                        const pct = totalVoters > 0 ? Math.round((rv.voters / totalVoters) * 100) : 0;
                        return {
                            '@type': 'pollOption',
                            text: typeof a.text === 'string' ? a.text : a.text?.text || '',
                            voter_count: rv.voters,
                            vote_percentage: pct,
                            is_chosen: rv.chosen,
                            is_being_chosen: false,
                        };
                    });
                })(),
                total_voter_count: media.results?.totalVoters || 0,
                is_anonymous: poll?.publicVoters === false,
                type: poll?.quiz
                    ? { '@type': 'pollTypeQuiz', correct_option_id: media.results?.correct || 0 }
                    : { '@type': 'pollTypeRegular', allow_multiple_answers: !!poll?.multipleChoice },
                open_period: poll?.closePeriod || 0,
                close_date: poll?.closeDate || 0,
                is_closed: !!poll?.closed,
            },
        };
    }

    // Localización simple
    if (mediaClass === 'MessageMediaGeo' || mediaClass === 'messageMediaGeo') {
        return {
            '@type': 'messageLocation',
            location: {
                '@type': 'location',
                latitude: media.geo?.lat || 0,
                longitude: media.geo?.long || 0,
                horizontal_accuracy: 0,
            },
            live_period: 0,
            expires_in: 0,
            heading: 0,
            proximity_alert_radius: 0,
        };
    }

    // Localización con nombre (venue)
    if (mediaClass === 'MessageMediaVenue' || mediaClass === 'messageMediaVenue') {
        return {
            '@type': 'messageVenue',
            venue: {
                '@type': 'venue',
                location: {
                    '@type': 'location',
                    latitude: media.geo?.lat || 0,
                    longitude: media.geo?.long || 0,
                    horizontal_accuracy: 0,
                },
                title: media.title || '',
                address: media.address || '',
                provider: media.provider || '',
                id: media.venueId || '',
                type: media.venueType || '',
            },
        };
    }

    // Localización en vivo
    if (mediaClass === 'MessageMediaGeoLive' || mediaClass === 'messageMediaGeoLive') {
        return {
            '@type': 'messageLocation',
            location: {
                '@type': 'location',
                latitude: media.geo?.lat || 0,
                longitude: media.geo?.long || 0,
                horizontal_accuracy: 0,
            },
            live_period: media.period || 0,
            expires_in: 0,
            heading: media.heading || 0,
            proximity_alert_radius: media.proximityNotificationRadius || 0,
        };
    }

    // Factura / pago de bot
    if (mediaClass === 'MessageMediaInvoice' || mediaClass === 'messageMediaInvoice') {
        return {
            '@type': 'messageInvoice',
            title: media.title || '',
            description: typeof media.description === 'string' ? media.description : media.description?.text || '',
            photo: media.photo ? translatePhoto(media.photo) : null,
            currency: media.currency || '',
            total_amount: media.totalAmount ? Number(media.totalAmount) : 0,
            start_parameter: media.startParam || '',
            is_test: !!media.test,
            need_shipping_address: !!media.shippingAddressRequested,
            receipt_message_id: 0,
        };
    }

    // Dado / emoji animado
    if (mediaClass === 'MessageMediaDice' || mediaClass === 'messageMediaDice') {
        return {
            '@type': 'messageDice',
            dice: {
                '@type': 'dice',
                emoji: media.emoticon || '🎲',
                value: media.value || 0,
            },
            initial_state: null,
            final_state: null,
            success_animation_frame_number: 0,
        };
    }

    // Juego de bot
    if (mediaClass === 'MessageMediaGame' || mediaClass === 'messageMediaGame') {
        const game = media.game;
        return {
            '@type': 'messageGame',
            game: {
                '@type': 'game',
                id: game ? String(game.id) : '0',
                short_name: game?.shortName || '',
                title: game?.title || '',
                text: {
                    '@type': 'formattedText',
                    text: game?.description || '',
                    entities: [],
                },
                description: game?.description || '',
                photo: game?.photo ? translatePhoto(game.photo) : null,
                animation: game?.document ? translateAnimation(game.document) : null,
            },
        };
    }

    // Texto con texto en el campo message (media desconocido pero tiene caption)
    if (msg.message) {
        return {
            '@type': 'messageText',
            text: { '@type': 'formattedText', text: msg.message, entities: [] },
            web_page: null,
        };
    }

    return { '@type': 'messageUnsupported' };
}

function translateTextEntity(entity) {
    const cls = entity.className || entity._;
    const MAP = {
        MessageEntityBold: 'textEntityTypeBold',
        MessageEntityItalic: 'textEntityTypeItalic',
        MessageEntityUnderline: 'textEntityTypeUnderline',
        MessageEntityStrike: 'textEntityTypeStrikethrough',
        MessageEntityCode: 'textEntityTypeCode',
        MessageEntityPre: 'textEntityTypePre',
        MessageEntityUrl: 'textEntityTypeUrl',
        MessageEntityTextUrl: 'textEntityTypeTextUrl',
        MessageEntityMention: 'textEntityTypeMention',
        MessageEntityMentionName: 'textEntityTypeMentionUser',
        MessageEntityHashtag: 'textEntityTypeHashtag',
        MessageEntityBotCommand: 'textEntityTypeBotCommand',
        MessageEntityCashtag: 'textEntityTypeCashtag',
        MessageEntitySpoiler: 'textEntityTypeSpoiler',
        MessageEntityPhone: 'textEntityTypePhoneNumber',
        MessageEntityEmail: 'textEntityTypeEmailAddress',
        MessageEntityCustomEmoji: 'textEntityTypeCustomEmoji',
    };
    const tdType = MAP[cls];
    if (!tdType) return null;
    const result = {
        '@type': 'textEntity',
        offset: entity.offset,
        length: entity.length,
        type: { '@type': tdType },
    };
    if (tdType === 'textEntityTypeTextUrl' && entity.url) result.type.url = entity.url;
    if (tdType === 'textEntityTypeMentionUser' && entity.userId) result.type.user_id = Number(entity.userId);
    if (tdType === 'textEntityTypeCustomEmoji' && entity.documentId != null) {
        result.type.custom_emoji_id = String(entity.documentId);
    }
    return result;
}

// ─── Instant View (IV) translation ───────────────────────────────────────────

function translateRichText(rt) {
    if (!rt) return { '@type': 'richTextPlain', text: '' };
    const cls = rt.className || rt._ || '';
    switch (cls) {
        case 'TextEmpty':
            return { '@type': 'richTextPlain', text: '' };
        case 'TextPlain':
            return { '@type': 'richTextPlain', text: rt.text || '' };
        case 'TextBold':
            return { '@type': 'richTextBold', text: translateRichText(rt.text) };
        case 'TextItalic':
            return { '@type': 'richTextItalic', text: translateRichText(rt.text) };
        case 'TextUnderline':
            return { '@type': 'richTextUnderline', text: translateRichText(rt.text) };
        case 'TextStrike':
            return { '@type': 'richTextStrikethrough', text: translateRichText(rt.text) };
        case 'TextFixed':
            return { '@type': 'richTextFixed', text: translateRichText(rt.text) };
        case 'TextUrl':
            return { '@type': 'richTextUrl', text: translateRichText(rt.text), url: rt.url || '', is_cached: false };
        case 'TextEmail':
            return { '@type': 'richTextEmailAddress', text: translateRichText(rt.text), email_address: rt.email || '' };
        case 'TextSubscript':
            return { '@type': 'richTextSubscript', text: translateRichText(rt.text) };
        case 'TextSuperscript':
            return { '@type': 'richTextSuperscript', text: translateRichText(rt.text) };
        case 'TextMarked':
            return { '@type': 'richTextMarked', text: translateRichText(rt.text) };
        case 'TextPhone':
            return { '@type': 'richTextPhoneNumber', text: translateRichText(rt.text), phone_number: rt.phone || '' };
        case 'TextImage':
            return { '@type': 'richTextIcon', document: null, width: rt.w || 0, height: rt.h || 0 };
        case 'TextAnchor':
            return { '@type': 'richTextAnchor', text: translateRichText(rt.text), name: rt.name || '' };
        case 'TextConcat': {
            const texts = (rt.texts || []).map(translateRichText);
            if (texts.length === 0) return { '@type': 'richTextPlain', text: '' };
            if (texts.length === 1) return texts[0];
            return { '@type': 'richTexts', texts };
        }
        default:
            // Plain string passed directly
            if (typeof rt === 'string') return { '@type': 'richTextPlain', text: rt };
            return { '@type': 'richTextPlain', text: '' };
    }
}

function translatePageCaption(caption) {
    const empty = { '@type': 'richTextPlain', text: '' };
    if (!caption) return { '@type': 'pageBlockCaption', text: empty, credit: empty };
    return {
        '@type': 'pageBlockCaption',
        text: translateRichText(caption.text),
        credit: translateRichText(caption.credit),
    };
}

function translatePageBlock(block, photos, docs) {
    if (!block) return null;
    const cls = block.className || block._ || '';
    switch (cls) {
        case 'PageBlockTitle':
            return { '@type': 'pageBlockTitle', title: translateRichText(block.text) };
        case 'PageBlockSubtitle':
            return { '@type': 'pageBlockSubtitle', subtitle: translateRichText(block.text) };
        case 'PageBlockAuthorDate':
            return {
                '@type': 'pageBlockAuthorDate',
                author: translateRichText(block.author),
                publish_date: Number(block.publishedDate || 0),
            };
        case 'PageBlockHeader':
            return { '@type': 'pageBlockHeader', header: translateRichText(block.text) };
        case 'PageBlockSubheader':
            return { '@type': 'pageBlockSubheader', subheader: translateRichText(block.text) };
        case 'PageBlockKicker':
            return { '@type': 'pageBlockKicker', kicker: translateRichText(block.text) };
        case 'PageBlockParagraph':
            return { '@type': 'pageBlockParagraph', text: translateRichText(block.text) };
        case 'PageBlockPreformatted':
            return {
                '@type': 'pageBlockPreformatted',
                text: translateRichText(block.text),
                language: block.language || '',
            };
        case 'PageBlockFooter':
            return { '@type': 'pageBlockFooter', footer: translateRichText(block.text) };
        case 'PageBlockDivider':
            return { '@type': 'pageBlockDivider' };
        case 'PageBlockAnchor':
            return { '@type': 'pageBlockAnchor', name: block.name || '' };
        case 'PageBlockBlockquote':
            return {
                '@type': 'pageBlockBlockQuote',
                text: translateRichText(block.text),
                credit: translateRichText(block.caption),
            };
        case 'PageBlockPullquote':
            return {
                '@type': 'pageBlockPullQuote',
                text: translateRichText(block.text),
                credit: translateRichText(block.caption),
            };
        case 'PageBlockList': {
            return {
                '@type': 'pageBlockList',
                items: (block.items || []).map(item => {
                    const ic = item.className || item._ || '';
                    if (ic === 'PageListItemBlocks') {
                        return {
                            '@type': 'pageBlockListItem',
                            label: '•',
                            page_blocks: (item.blocks || [])
                                .map(b => translatePageBlock(b, photos, docs))
                                .filter(Boolean),
                        };
                    }
                    return {
                        '@type': 'pageBlockListItem',
                        label: '•',
                        page_blocks: [{ '@type': 'pageBlockParagraph', text: translateRichText(item.text) }],
                    };
                }),
            };
        }
        case 'PageBlockOrderedList': {
            return {
                '@type': 'pageBlockList',
                items: (block.items || []).map(item => {
                    const ic = item.className || item._ || '';
                    if (ic === 'PageListOrderedItemBlocks') {
                        return {
                            '@type': 'pageBlockListItem',
                            label: item.num || '',
                            page_blocks: (item.blocks || [])
                                .map(b => translatePageBlock(b, photos, docs))
                                .filter(Boolean),
                        };
                    }
                    return {
                        '@type': 'pageBlockListItem',
                        label: item.num || '',
                        page_blocks: [{ '@type': 'pageBlockParagraph', text: translateRichText(item.text) }],
                    };
                }),
            };
        }
        case 'PageBlockPhoto': {
            const photo = photos && photos.find(p => String(p.id) === String(block.photoId));
            return {
                '@type': 'pageBlockPhoto',
                photo: photo ? translatePhoto(photo) : null,
                caption: translatePageCaption(block.caption),
                url: block.url || '',
                is_cached: false,
            };
        }
        case 'PageBlockVideo': {
            const doc = docs && docs.find(d => String(d.id) === String(block.videoId));
            return {
                '@type': 'pageBlockVideo',
                video: doc ? translateVideo(doc) : null,
                caption: translatePageCaption(block.caption),
                need_autoplay: !!block.autoplay,
                is_looped: !!block.loop,
            };
        }
        case 'PageBlockAnimation': {
            const doc = docs && docs.find(d => String(d.id) === String(block.videoId));
            return {
                '@type': 'pageBlockAnimation',
                animation: doc ? translateAnimation(doc) : null,
                caption: translatePageCaption(block.caption),
                need_autoplay: !!block.autoplay,
            };
        }
        case 'PageBlockAudio': {
            const doc = docs && docs.find(d => String(d.id) === String(block.audioId));
            return {
                '@type': 'pageBlockAudio',
                audio: doc ? translateAudio(doc) : null,
                caption: translatePageCaption(block.caption),
            };
        }
        case 'PageBlockCover':
            return { '@type': 'pageBlockCover', cover: translatePageBlock(block.cover, photos, docs) };
        case 'PageBlockEmbed': {
            const posterPhoto = block.posterPhotoId
                ? photos && photos.find(p => String(p.id) === String(block.posterPhotoId))
                : null;
            return {
                '@type': 'pageBlockEmbedded',
                url: block.url || '',
                html: block.html || '',
                poster_photo: posterPhoto ? translatePhoto(posterPhoto) : null,
                width: Number(block.w || 0),
                height: Number(block.h || 0),
                caption: translatePageCaption(block.caption),
                is_full_width: !!block.fullWidth,
                allow_scrolling: !!block.allowScrolling,
            };
        }
        case 'PageBlockEmbedPost': {
            const authorPhoto = block.authorPhotoId
                ? photos && photos.find(p => String(p.id) === String(block.authorPhotoId))
                : null;
            return {
                '@type': 'pageBlockEmbeddedPost',
                url: block.url || '',
                author: block.author || '',
                author_photo: authorPhoto ? translatePhoto(authorPhoto) : null,
                date: Number(block.date || 0),
                page_blocks: (block.blocks || []).map(b => translatePageBlock(b, photos, docs)).filter(Boolean),
                caption: translatePageCaption(block.caption),
            };
        }
        case 'PageBlockCollage':
            return {
                '@type': 'pageBlockCollage',
                page_blocks: (block.items || []).map(b => translatePageBlock(b, photos, docs)).filter(Boolean),
                caption: translatePageCaption(block.caption),
            };
        case 'PageBlockSlideshow':
            return {
                '@type': 'pageBlockSlideshow',
                page_blocks: (block.items || []).map(b => translatePageBlock(b, photos, docs)).filter(Boolean),
                caption: translatePageCaption(block.caption),
            };
        case 'PageBlockChannel': {
            const ch = block.channel || {};
            return {
                '@type': 'pageBlockChatLink',
                title: ch.title || '',
                username: ch.username || '',
                invite_link: '',
            };
        }
        case 'PageBlockTable': {
            return {
                '@type': 'pageBlockTable',
                caption: translateRichText(block.title),
                cells: (block.rows || []).map(row =>
                    (row.cells || []).map(cell => ({
                        '@type': 'pageBlockTableCell',
                        is_header: !!cell.header,
                        text: translateRichText(cell.text),
                        align: cell.alignCenter ? 'center' : cell.alignRight ? 'right' : 'left',
                        valign: cell.valignBottom ? 'bottom' : cell.valignMiddle ? 'middle' : 'top',
                        colspan: Number(cell.colspan || 1),
                        rowspan: Number(cell.rowspan || 1),
                    })),
                ),
                is_bordered: !!block.bordered,
                is_striped: !!block.striped,
            };
        }
        case 'PageBlockDetails':
            return {
                '@type': 'pageBlockDetails',
                header: translateRichText(block.title),
                page_blocks: (block.blocks || []).map(b => translatePageBlock(b, photos, docs)).filter(Boolean),
                is_open: !!block.open,
            };
        case 'PageBlockRelatedArticles':
            return {
                '@type': 'pageBlockRelatedArticles',
                header: translateRichText(block.title),
                articles: (block.articles || []).map(a => ({
                    '@type': 'pageBlockRelatedArticle',
                    url: a.url || '',
                    title: a.title || '',
                    description: a.description || '',
                    photo: a.photoId
                        ? translatePhoto(photos && photos.find(p => String(p.id) === String(a.photoId)))
                        : null,
                    author: a.author || '',
                    publish_date: Number(a.publishedDate || 0),
                })),
            };
        case 'PageBlockMap':
            return {
                '@type': 'pageBlockMap',
                location: {
                    '@type': 'location',
                    latitude: block.geo?.lat || 0,
                    longitude: block.geo?.long || 0,
                    horizontal_accuracy: 0,
                },
                zoom: Number(block.zoom || 0),
                width: Number(block.w || 0),
                height: Number(block.h || 0),
                caption: translatePageCaption(block.caption),
            };
        default:
            return null;
    }
}

export function translateInstantView(page) {
    if (!page) return null;
    const photos = page.photos || [];
    const docs = page.documents || [];
    return {
        '@type': 'webPageInstantView',
        page_blocks: (page.blocks || []).map(b => translatePageBlock(b, photos, docs)).filter(Boolean),
        view_count: Number(page.views || 0),
        version: 2,
        is_rtl: !!page.rtl,
        is_full: true,
    };
}
