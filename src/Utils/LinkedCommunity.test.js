import { resolveLinkedCommunityChatId } from './LinkedCommunity';

describe('resolveLinkedCommunityChatId', () => {
    it('converts a linked channel to the TDLib chat id used by the UI', () => {
        expect(resolveLinkedCommunityChatId('123', [{ className: 'Channel', id: 123 }])).toBe(-1000000000123);
    });

    it('uses the returned entity type instead of assuming a channel', () => {
        expect(resolveLinkedCommunityChatId(45, [{ className: 'Chat', id: 45 }])).toBe(-45);
    });

    it('uses a safe channel fallback when Telegram omits the cached entity', () => {
        expect(resolveLinkedCommunityChatId(77)).toBe(-1000000000077);
    });

    it('rejects missing and unsafe ids', () => {
        expect(resolveLinkedCommunityChatId(0)).toBe(0);
        expect(resolveLinkedCommunityChatId('not-an-id')).toBe(0);
        expect(resolveLinkedCommunityChatId(Number.MAX_SAFE_INTEGER + 1)).toBe(0);
    });
});
