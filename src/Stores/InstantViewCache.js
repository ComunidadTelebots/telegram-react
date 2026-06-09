/*
 * LRU cache for pre-translated Instant View pages.
 * Populated when a message with a webPage arrives (cachedPage already in the
 * server response), so the IV opens without any network round-trip.
 * MAX_SIZE evicts the oldest entry to bound memory usage.
 */

const MAX_SIZE = 50;

// Insertion-ordered Map — oldest key is first (Map preserves insertion order).
const _cache = new Map();

export function get(url) {
    if (!url) return null;
    const entry = _cache.get(url);
    if (!entry) return null;
    // Move to end (most-recently-used).
    _cache.delete(url);
    _cache.set(url, entry);
    return entry;
}

export function set(url, iv) {
    if (!url || !iv) return;
    if (_cache.has(url)) {
        _cache.delete(url);
    } else if (_cache.size >= MAX_SIZE) {
        // Evict oldest (first key in insertion order).
        _cache.delete(_cache.keys().next().value);
    }
    _cache.set(url, iv);
}
