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
            downloaded_size: 0
        },
        remote: {
            '@type': 'remoteFile',
            id: remoteId || String(fileId),
            unique_id: remoteId || String(fileId),
            is_uploading_active: false,
            is_uploading_completed: true,
            uploaded_size: size || 0
        }
    };
}

export function translatePhoto(gPhoto) {
    if (!gPhoto) return null;
    if (gPhoto.id) {
        mediaCache.set(Number(gPhoto.id), gPhoto);
    }
    const sizes = (gPhoto.sizes || [])
        .map(sz => {
            const type = sz.type || 'x';
            const w = sz.w || sz.width || 320;
            const h = sz.h || sz.height || 240;
            const szBytes = sz.size || (sz.bytes ? sz.bytes.length : 0) || 10000;
            return {
                '@type': 'photoSize',
                type,
                width: Number(w),
                height: Number(h),
                photo: translateFile(gPhoto.id, szBytes, gPhoto.id ? String(gPhoto.id) : '')
            };
        })
        .filter(Boolean);

    if (sizes.length === 0) {
        sizes.push({
            '@type': 'photoSize',
            type: 'x',
            width: 320,
            height: 240,
            photo: translateFile(gPhoto.id || 0, 10000, '')
        });
    }

    return {
        '@type': 'photo',
        has_stickers: false,
        minithumbnail: null,
        sizes
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
        document: translateFile(gDoc.id, size, gDoc.id ? String(gDoc.id) : '')
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
        animation: translateFile(gDoc.id, size, gDoc.id ? String(gDoc.id) : '')
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
        video: translateFile(gDoc.id, size, gDoc.id ? String(gDoc.id) : '')
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
        audio: translateFile(gDoc.id, size, gDoc.id ? String(gDoc.id) : '')
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

    const stickerAttr = (gDoc.attributes || []).find(a => (a.className || a._) === 'DocumentAttributeSticker');
    const alt = stickerAttr?.alt || '';
    const setId = stickerAttr?.stickerset?.id ? String(stickerAttr.stickerset.id) : '0';

    const imgAttr = (gDoc.attributes || []).find(a => (a.className || a._) === 'DocumentAttributeImageSize');
    const width = imgAttr?.w || 512;
    const height = imgAttr?.h || 512;

    return {
        '@type': 'sticker',
        set_id: setId,
        width: Number(width),
        height: Number(height),
        emoji: alt,
        is_animated: isAnimated,
        is_video: false,
        thumbnail: null,
        sticker: translateFile(gDoc.id, size, gDoc.id ? String(gDoc.id) : '')
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
        covers: []
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
        emojis: stickers.map(s => ({ '@type': 'emojis', emojis: s.emoji ? [s.emoji] : [] }))
    };
}

// ─── User ────────────────────────────────────────────────────────────────────

export function translateUser(user) {
    if (!user) return null;
    return {
        '@type': 'user',
        id: Number(user.id),
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
                  need_location: false
              }
            : { '@type': 'userTypeRegular' },
        is_verified: !!user.verified,
        is_support: !!user.support,
        restriction_reason: user.restrictionReason?.[0]?.text || '',
        have_access: true,
        language_code: ''
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

    // El order determina la posición en la lista; usamos date × 1000 para ordenar por recencia.
    const date = dialog?.date || 0;
    const pinned = dialog?.pinned || false;
    const order = pinned ? '9223372036854775807' : String(date * 1000);

    return {
        '@type': 'chat',
        id: chatId,
        type,
        title,
        photo: null,
        last_message: lastMsg,
        order,
        is_pinned: pinned,
        is_marked_as_unread: false,
        is_sponsored: false,
        can_be_deleted_only_for_self: true,
        can_be_deleted_for_all_users: false,
        can_be_reported: false,
        default_disable_notification: false,
        unread_count: dialog?.unreadCount || 0,
        last_read_inbox_message_id: 0,
        last_read_outbox_message_id: 0,
        unread_mention_count: 0,
        notification_settings: {
            '@type': 'chatNotificationSettings',
            use_default_mute_for: true,
            mute_for: 0,
            use_default_sound: true,
            sound: 'default',
            use_default_show_preview: true,
            show_preview: true,
            use_default_disable_pinned_message_notifications: true,
            disable_pinned_message_notifications: false,
            use_default_disable_mention_notifications: true,
            disable_mention_notifications: false
        },
        pinned_message_id: 0,
        reply_markup_message_id: 0,
        draft_message: null,
        client_data: ''
    };
}

// ─── Message ──────────────────────────────────────────────────────────────────

export function translateMessage(msg, chatId) {
    if (!msg) return null;
    const cls = msg.className || msg._;
    if (cls === 'MessageEmpty' || cls === 'messageEmpty') return null;

    const content = translateMessageContent(msg);
    if (!content) return null;

    let sender_id;
    if (msg.fromId) {
        const fc = msg.fromId.className || msg.fromId._;
        if (fc === 'PeerUser') {
            sender_id = { '@type': 'messageSenderUser', user_id: Number(msg.fromId.userId) };
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
        forward_info: null,
        interaction_info: msg.views
            ? {
                  '@type': 'messageInteractionInfo',
                  view_count: msg.views || 0,
                  forward_count: msg.forwards || 0,
                  reply_info: null
              }
            : null,
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
        reactions: translateReactions(msg.reactions)
    };
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
                is_chosen: r.chosenOrder != null
            }))
    };
}

function translateMessageContent(msg) {
    const media = msg.media;
    const mediaClass = media?.className || media?._;

    // Texto puro
    if (!media || mediaClass === 'MessageMediaEmpty' || mediaClass === 'messageMediaEmpty') {
        return {
            '@type': 'messageText',
            text: {
                '@type': 'formattedText',
                text: msg.message || '',
                entities: (msg.entities || []).map(translateTextEntity).filter(Boolean)
            },
            web_page: null
        };
    }

    // Foto
    if (mediaClass === 'MessageMediaPhoto' || mediaClass === 'messageMediaPhoto') {
        return {
            '@type': 'messagePhoto',
            photo: translatePhoto(media.photo),
            caption: {
                '@type': 'formattedText',
                text: msg.message || '',
                entities: []
            },
            is_secret: !!media.ttlSeconds
        };
    }

    // Documento / sticker / audio / video
    if (mediaClass === 'MessageMediaDocument' || mediaClass === 'messageMediaDocument') {
        const doc = media.document;
        const attrs = doc?.attributes || [];
        const isSticker = attrs.some(a => (a.className || a._) === 'DocumentAttributeSticker');
        const isAudio = attrs.some(a => (a.className || a._) === 'DocumentAttributeAudio');
        const isVideo = attrs.some(a => (a.className || a._) === 'DocumentAttributeVideo');
        const isAnim = attrs.some(a => (a.className || a._) === 'DocumentAttributeAnimated');

        if (isSticker) return { '@type': 'messageSticker', sticker: translateSticker(doc) };
        if (isAnim)
            return {
                '@type': 'messageAnimation',
                animation: translateAnimation(doc),
                caption: { '@type': 'formattedText', text: msg.message || '', entities: [] },
                is_secret: false
            };
        if (isVideo)
            return {
                '@type': 'messageVideo',
                video: translateVideo(doc),
                caption: { '@type': 'formattedText', text: msg.message || '', entities: [] },
                is_secret: false
            };
        if (isAudio)
            return {
                '@type': 'messageAudio',
                audio: translateAudio(doc),
                caption: { '@type': 'formattedText', text: msg.message || '', entities: [] }
            };

        return {
            '@type': 'messageDocument',
            document: translateDocument(doc),
            caption: {
                '@type': 'formattedText',
                text: msg.message || '',
                entities: []
            }
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
                user_id: media.userId ? Number(media.userId) : 0
            }
        };
    }

    // Localización
    if (mediaClass === 'MessageMediaGeo' || mediaClass === 'messageMediaGeo') {
        return {
            '@type': 'messageLocation',
            location: {
                '@type': 'location',
                latitude: media.geo?.lat || 0,
                longitude: media.geo?.long || 0
            },
            live_period: 0,
            expires_in: 0,
            heading: 0,
            proximity_alert_radius: 0
        };
    }

    // Texto con texto en el campo message (media desconocido pero tiene caption)
    if (msg.message) {
        return {
            '@type': 'messageText',
            text: { '@type': 'formattedText', text: msg.message, entities: [] },
            web_page: null
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
        MessageEntityEmail: 'textEntityTypeEmailAddress'
    };
    const tdType = MAP[cls];
    if (!tdType) return null;
    const result = {
        '@type': 'textEntity',
        offset: entity.offset,
        length: entity.length,
        type: { '@type': tdType }
    };
    if (tdType === 'textEntityTypeTextUrl' && entity.url) result.type.url = entity.url;
    if (tdType === 'textEntityTypeMentionUser' && entity.userId) result.type.user_id = Number(entity.userId);
    return result;
}
