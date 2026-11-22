export function offersAmpReader(value, type) {
    let url;
    try {
        url = new URL(value);
    } catch {
        return false;
    }
    if (url.protocol !== 'https:' || url.username || url.password) return false;
    return type === 'article' || /^amp\./i.test(url.hostname)
        || /\.cdn\.ampproject\.org$/i.test(url.hostname)
        || /(?:\/amp(?:\/|$)|\.amp(?:\.html?)?$)/i.test(url.pathname)
        || ['amp', 'amphtml'].some(key => url.searchParams.has(key))
        || url.searchParams.get('output') === 'amp';
}

export function publisherAmpUrl(doc, sourceUrl) {
    const link = doc.head.querySelector('link[rel~="amphtml" i][href]');
    const value = link?.getAttribute('href')?.trim();
    if (!value) return null;
    try {
        const base = doc.head.querySelector('base[href]')?.getAttribute('href');
        const url = new URL(value, base ? new URL(base, sourceUrl) : sourceUrl);
        if (url.protocol !== 'https:' || url.username || url.password) return null;
        url.hash = '';
        return url.href;
    } catch {
        return null;
    }
}
