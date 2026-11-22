import { getSafeHttpUrl } from '../Utils/SafeExternalUrl';

function prefix(account) {
    if (!account || !/^\d+$/.test(String(account)) || String(account) === '0') throw new Error('Cuenta no disponible');
    return 'telebots.reading.v1.' + account + ':';
}

export function saveArticle(account, url, title, text) {
    const safeUrl = getSafeHttpUrl(url);
    if (!safeUrl || !text.trim()) throw new Error('Artículo vacío');
    if (text.length > 500000) throw new Error('El artículo supera el límite de 500.000 caracteres.');
    const article = { url: safeUrl, title: title || new URL(safeUrl).hostname, text: text.trim(), savedAt: Date.now() };
    localStorage.setItem(prefix(account) + safeUrl, JSON.stringify(article));
}

export function listArticles(account) {
    const start = prefix(account);
    const items = [];
    for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index);
        if (!key?.startsWith(start)) continue;
        try {
            const entry = JSON.parse(localStorage.getItem(key));
            if (typeof entry?.text === 'string' && typeof entry.title === 'string' &&
                getSafeHttpUrl(entry.url) === entry.url && key === start + entry.url) items.push(entry);
        } catch { /* Omitir únicamente la entrada dañada. */ }
    }
    return items.sort((a, b) => b.savedAt - a.savedAt);
}

export function removeArticle(account, url) {
    localStorage.removeItem(prefix(account) + url);
}
