import { entityToTdlibChatId } from './GramJs/EntityTranslator';

/**
 * MTProto exposes ChannelFull.linkedChatId as the bare channel id while the
 * rest of the application uses TDLib-style ids. Prefer the entity returned in
 * the same response so basic chats and future peer types remain safe.
 */
export function resolveLinkedCommunityChatId(linkedChatId, entities = []) {
    const bareId = Number(linkedChatId || 0);
    if (!Number.isSafeInteger(bareId) || bareId <= 0) return 0;

    const linkedEntity = entities.find(entity => Number(entity && entity.id) === bareId);
    if (linkedEntity) return entityToTdlibChatId(linkedEntity);

    // ChannelFull.linked_chat_id currently always points at a channel or
    // supergroup. This fallback keeps the link usable if Telegram omits the
    // entity because it is already cached by the client.
    return -1000000000000 - bareId;
}
