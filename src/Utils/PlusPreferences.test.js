import {
    PLUS_DEFAULTS, exportPlusPreferences, importPlusPreferences, readNoticeTargets,
    readPlusPreferences, setNoticeTarget, validatePlusPreferences,
} from './PlusPreferences';

const createStorage = () => {
    const values = new Map();
    return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};

describe('PlusPreferences', () => {
    it('exports only the versioned allowlisted preferences', () => {
        const storage = createStorage();
        storage.setItem('telegram_session', 'secret');
        const payload = JSON.parse(exportPlusPreferences(storage));
        expect(payload.preferences).toEqual(PLUS_DEFAULTS);
        expect(JSON.stringify(payload)).not.toContain('secret');
        expect(payload).not.toHaveProperty('telegram_session');
    });

    it('rejects unknown fields, invalid values and incompatible versions', () => {
        expect(() => validatePlusPreferences({ token: 'secret' })).toThrow('no permitidos');
        expect(() => validatePlusPreferences({ avatarAction: 'javascript:' })).toThrow('avatar');
        expect(() => importPlusPreferences(JSON.stringify({ schema: 'wrong', version: 1, preferences: {} }), createStorage()))
            .toThrow('incompatible');
    });

    it('imports valid preferences without importing notification targets', () => {
        const storage = createStorage();
        const imported = importPlusPreferences(JSON.stringify({
            schema: 'telegram-react-plus-preferences', version: 1,
            preferences: { presenceAlerts: true, avatarAction: 'none' },
        }), storage);
        expect(imported.presenceAlerts).toBe(true);
        expect(readPlusPreferences(storage).avatarAction).toBe('none');
        expect(readNoticeTargets(storage)).toEqual([]);
    });

    it('stores only numeric targets and removes them explicitly', () => {
        const storage = createStorage();
        setNoticeTarget({ chatId: 10, userId: 20 }, true, storage);
        expect(readNoticeTargets(storage)).toEqual([{ chatId: 10, userId: 20 }]);
        setNoticeTarget({ chatId: 10, userId: 20 }, false, storage);
        expect(readNoticeTargets(storage)).toEqual([]);
    });
});

