import { EventEmitter } from 'events';

export function normalizeBrowserUrl(value) {
    try {
        const url = new URL(String(value || '').trim());
        if (!['http:', 'https:'].includes(url.protocol)) return null;
        url.username = '';
        url.password = '';
        return url.href;
    } catch {
        return null;
    }
}

class InternalBrowserStore extends EventEmitter {
    open(value) {
        const url = normalizeBrowserUrl(value);
        if (!url) return false;
        this.emit('open', { url });
        return true;
    }
}

const store = new InternalBrowserStore();
store.setMaxListeners(Infinity);

export default store;
