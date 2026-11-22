import { describe, expect, it } from 'vitest';
import { getCodeInfo, validCode } from './LoginCode';

function info(method, extra = {}, response = {}) {
    return getCodeInfo({ type: { className: 'auth.SentCodeType' + method, ...extra }, ...response }, '+123', 1000);
}

describe('phone login challenges', () => {
    it.each([['App', 'TelegramMessage'], ['Sms', 'Sms'], ['Call', 'Call'], ['EmailCode', 'Email'], ['FragmentSms', 'Fragment']])('uses the delivery method and length for %s', (method, expected) => {
        const { type, next_type } = info(method, { length: 6 });
        expect(type['@type']).toBe('authenticationCodeType' + expected);
        expect(validCode('012345', type)).toBe(true);
        expect(validCode('12345', type)).toBe(false);
        expect(validCode('abcdef', type)).toBe(false);
        expect(next_type).toBeNull();
    });

    it.each(['SmsWord', 'SmsPhrase'])('accepts text for %s', method => {
        const { type } = info(method);
        expect(validCode('palabra de ejemplo', type)).toBe(true);
        expect(validCode(' ', type)).toBe(false);
    });

    it('keeps the resend deadline and masked address', () => {
        const challenge = info('EmailCode', { emailPattern: 'a***@example.org' }, { nextType: { className: 'auth.CodeTypeSms' }, timeout: 30 });
        expect(challenge.resend_at).toBe(31000);
        expect(challenge.next_type).toBe('auth.CodeTypeSms');
        expect(challenge.type.email_pattern).toBe('a***@example.org');
    });

    it('does not accept a code for an unsupported method', () => {
        expect(validCode('12345', info('FirebaseSms').type)).toBe(false);
    });
});
