import { get, set, keys, del } from 'idb-keyval';

const MSG_PREFIX = 'msg_';

export const loadMessages = async chatId => {
    return await get(MSG_PREFIX + chatId).catch(() => null);
};

export const saveMessages = async (chatId, messages) => {
    if (!messages || !messages.length) return;
    const toStore = [...messages].sort((a, b) => b.id - a.id).slice(0, 50);
    await set(MSG_PREFIX + chatId, toStore);
};

export const clearAllMessages = async () => {
    try {
        const allKeys = await keys();
        await Promise.all(allKeys.filter(k => String(k).startsWith(MSG_PREFIX)).map(k => del(k)));
    } catch (e) {}
};
