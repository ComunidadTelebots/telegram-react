// Keep GramJS wire constructors out of the login form.
const methods = {
    App: 'TelegramMessage', Sms: 'Sms', Call: 'Call', FlashCall: 'FlashCall',
    MissedCall: 'MissedCall', EmailCode: 'Email', FragmentSms: 'Fragment',
    SmsWord: 'SmsWord', SmsPhrase: 'SmsPhrase'
};

export function getCodeInfo(result, phone, now = Date.now()) {
    const sent = result.type;
    const method = methods[sent?.className?.replace(/^auth\.SentCodeType/, '')] || 'Unsupported';
    const timeout = Math.max(0, result.timeout || 0);
    return {
        phone_number: phone,
        type: {
            '@type': 'authenticationCodeType' + method,
            length: sent?.length || 0,
            email_pattern: sent?.emailPattern || '',
            prefix: sent?.prefix || ''
        },
        next_type: result.nextType?.className || null,
        timeout,
        resend_at: now + timeout * 1000
    };
}

export function acceptsText(type) {
    return ['authenticationCodeTypeSmsWord', 'authenticationCodeTypeSmsPhrase'].includes(type?.['@type']);
}

export function validCode(value, type) {
    if (!type || type['@type'] === 'authenticationCodeTypeUnsupported') return false;
    if (acceptsText(type)) return Boolean(value.trim());
    return /^\d+$/.test(value) && (!type.length || value.length === type.length);
}
