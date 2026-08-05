export const PLUS_PREFERENCES_KEY = 'tg_plus_preferences_v1';
export const PLUS_NOTICE_TARGETS_KEY = 'tg_plus_notice_targets_v1';
export const PLUS_EXPORT_SCHEMA = 'telegram-react-plus-preferences';
export const PLUS_EXPORT_VERSION = 1;
export const MAX_NOTICE_TARGETS = 20;

export const PLUS_DEFAULTS = Object.freeze({
    presenceAlerts: false,
    typingAlerts: false,
    alertCooldownMs: 300000,
    avatarAction: 'photo',
});

const ALLOWED_KEYS = Object.freeze(Object.keys(PLUS_DEFAULTS));
const AVATAR_ACTIONS = new Set(['photo', 'copy_username', 'none']);

function safeStorage(storage) {
    try {
        return storage || window.localStorage;
    } catch (_) {
        return null;
    }
}

export function validatePlusPreferences(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Preferencias no válidas.');
    const unknown = Object.keys(value).filter(key => !ALLOWED_KEYS.includes(key));
    if (unknown.length) throw new Error('El archivo contiene ajustes no permitidos.');
    const result = { ...PLUS_DEFAULTS };
    if ('presenceAlerts' in value) {
        if (typeof value.presenceAlerts !== 'boolean') throw new Error('Avisos de presencia no válidos.');
        result.presenceAlerts = value.presenceAlerts;
    }
    if ('typingAlerts' in value) {
        if (typeof value.typingAlerts !== 'boolean') throw new Error('Avisos de escritura no válidos.');
        result.typingAlerts = value.typingAlerts;
    }
    if ('alertCooldownMs' in value) {
        if (!Number.isInteger(value.alertCooldownMs) || value.alertCooldownMs < 60000 || value.alertCooldownMs > 3600000) {
            throw new Error('Límite de avisos no válido.');
        }
        result.alertCooldownMs = value.alertCooldownMs;
    }
    if ('avatarAction' in value) {
        if (!AVATAR_ACTIONS.has(value.avatarAction)) throw new Error('Acción de avatar no válida.');
        result.avatarAction = value.avatarAction;
    }
    return Object.freeze(result);
}

export function readPlusPreferences(storage) {
    const target = safeStorage(storage);
    if (!target) return PLUS_DEFAULTS;
    try {
        const raw = target.getItem(PLUS_PREFERENCES_KEY);
        return raw ? validatePlusPreferences(JSON.parse(raw)) : PLUS_DEFAULTS;
    } catch (_) {
        return PLUS_DEFAULTS;
    }
}

export function writePlusPreferences(value, storage) {
    const preferences = validatePlusPreferences(value);
    const target = safeStorage(storage);
    if (!target) throw new Error('El navegador no permite guardar preferencias.');
    target.setItem(PLUS_PREFERENCES_KEY, JSON.stringify(preferences));
    return preferences;
}

export function exportPlusPreferences(storage) {
    return JSON.stringify({
        schema: PLUS_EXPORT_SCHEMA,
        version: PLUS_EXPORT_VERSION,
        preferences: readPlusPreferences(storage),
    }, null, 2);
}

export function importPlusPreferences(text, storage) {
    if (typeof text !== 'string' || text.length > 16384) throw new Error('Archivo de preferencias no válido o demasiado grande.');
    let payload;
    try { payload = JSON.parse(text); } catch (_) { throw new Error('El archivo no es JSON válido.'); }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Formato no válido.');
    const envelopeKeys = Object.keys(payload);
    if (envelopeKeys.some(key => !['schema', 'version', 'preferences'].includes(key))) {
        throw new Error('El archivo contiene datos no permitidos.');
    }
    if (payload.schema !== PLUS_EXPORT_SCHEMA || payload.version !== PLUS_EXPORT_VERSION) {
        throw new Error('Versión de preferencias incompatible.');
    }
    return writePlusPreferences(payload.preferences, storage);
}

export function readNoticeTargets(storage) {
    const target = safeStorage(storage);
    if (!target) return [];
    try {
        const parsed = JSON.parse(target.getItem(PLUS_NOTICE_TARGETS_KEY) || '[]');
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(item => item && Number.isSafeInteger(item.chatId) && Number.isSafeInteger(item.userId))
            .slice(0, MAX_NOTICE_TARGETS).map(item => ({ chatId: item.chatId, userId: item.userId }));
    } catch (_) { return []; }
}

export function setNoticeTarget(entry, enabled, storage) {
    if (!entry || !Number.isSafeInteger(entry.chatId) || !Number.isSafeInteger(entry.userId)) {
        throw new Error('Chat no válido.');
    }
    const target = safeStorage(storage);
    if (!target) throw new Error('El navegador no permite guardar preferencias.');
    let entries = readNoticeTargets(target).filter(item => item.chatId !== entry.chatId);
    if (enabled) {
        if (entries.length >= MAX_NOTICE_TARGETS) throw new Error(`Solo puedes seguir ${MAX_NOTICE_TARGETS} chats.`);
        entries.push({ chatId: entry.chatId, userId: entry.userId });
    }
    target.setItem(PLUS_NOTICE_TARGETS_KEY, JSON.stringify(entries));
    return entries;
}

export function getAvatarAction(storage) {
    return readPlusPreferences(storage).avatarAction;
}

