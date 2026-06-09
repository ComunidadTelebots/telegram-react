/*
 * LRU cache for pre-extracted AMP reader-mode content.
 * Keyed by the original article URL (not the AMP Cache URL).
 * Stores { html: string, title: string } objects.
 */

const MAX_SIZE = 30;
const _cache = new Map();

export function get(url) {
    if (!url) return null;
    const entry = _cache.get(url);
    if (!entry) return null;
    _cache.delete(url);
    _cache.set(url, entry);
    return entry;
}

export function set(url, content) {
    if (!url || !content) return;
    if (_cache.has(url)) {
        _cache.delete(url);
    } else if (_cache.size >= MAX_SIZE) {
        _cache.delete(_cache.keys().next().value);
    }
    _cache.set(url, content);
}
