/*
 * StoryStore — almacena historias activas y estado de lectura por peer.
 * Sigue el mismo patrón EventEmitter que los demás stores del proyecto.
 */
import { EventEmitter } from 'events';
import TdLibController from '../Controllers/TdLibController';

class StoryStore extends EventEmitter {
    constructor() {
        super();
        this.reset();
        this.addTdLibListener();
        this.setMaxListeners(Infinity);
    }

    reset = () => {
        // Map<sender_chat_id, { stories: Map<story_id, story>, max_read_id, order }>
        this._peers = new Map();
    };

    // ─── Selectores públicos ─────────────────────────────────────────────────

    /** Devuelve todos los peers con historias activas, ordenados por .order desc */
    getActivePeers() {
        return [...this._peers.values()].sort((a, b) => (b.order || 0) - (a.order || 0));
    }

    /** Devuelve todos los peers que tienen al menos una historia sin leer */
    getUnreadPeers() {
        return this.getActivePeers().filter(peer => {
            const lastStory = this._lastStory(peer);
            return lastStory && lastStory.id > (peer.max_read_id || 0);
        });
    }

    /** Devuelve las historias de un peer como array ordenado por id */
    getStories(chatId) {
        const peer = this._peers.get(chatId);
        if (!peer) return [];
        return [...peer.stories.values()].sort((a, b) => a.id - b.id);
    }

    /** Devuelve una historia concreta */
    getStory(chatId, storyId) {
        return this._peers.get(chatId)?.stories.get(storyId) || null;
    }

    // ─── Mutaciones internas ─────────────────────────────────────────────────

    _lastStory(peer) {
        if (!peer || peer.stories.size === 0) return null;
        let last = null;
        for (const s of peer.stories.values()) {
            if (!last || s.id > last.id) last = s;
        }
        return last;
    }

    _upsertStory(story) {
        if (!story) return;
        const { sender_chat_id, id } = story;
        if (!sender_chat_id || !id) return;
        if (!this._peers.has(sender_chat_id)) {
            this._peers.set(sender_chat_id, { sender_chat_id, stories: new Map(), max_read_id: 0, order: 0 });
        }
        this._peers.get(sender_chat_id).stories.set(id, story);
    }

    _setPeerData(peer) {
        const existing = this._peers.get(peer.sender_chat_id) || {
            sender_chat_id: peer.sender_chat_id,
            stories: new Map(),
            max_read_id: 0,
            order: 0,
        };
        if (peer.max_read_id != null) existing.max_read_id = peer.max_read_id;
        if (peer.order != null) existing.order = peer.order;
        for (const story of peer.stories || []) {
            if (story) existing.stories.set(story.id, story);
        }
        this._peers.set(peer.sender_chat_id, existing);
    }

    // ─── Handlers de updates ─────────────────────────────────────────────────

    onUpdate = update => {
        switch (update['@type']) {
            case 'updateAuthorizationState': {
                if (update.authorization_state?.['@type'] === 'authorizationStateClosed') {
                    this.reset();
                }
                break;
            }

            case 'updateStory': {
                const { story } = update;
                if (!story) break;
                this._upsertStory(story);
                this.emit('updateStory', update);
                break;
            }

            case 'updateStoryDeleted': {
                const { sender_chat_id, story_id } = update;
                const peer = this._peers.get(sender_chat_id);
                if (peer) {
                    peer.stories.delete(story_id);
                    if (peer.stories.size === 0) this._peers.delete(sender_chat_id);
                }
                this.emit('updateStoryDeleted', update);
                break;
            }

            case 'updateReadStories': {
                const { sender_chat_id, max_story_id } = update;
                const peer = this._peers.get(sender_chat_id);
                if (peer) {
                    peer.max_read_id = Math.max(peer.max_read_id || 0, max_story_id || 0);
                    // Marcar historias como leídas en caché
                    for (const story of peer.stories.values()) {
                        if (story.id <= max_story_id) {
                            peer.stories.set(story.id, { ...story, is_read: true });
                        }
                    }
                }
                this.emit('updateReadStories', update);
                break;
            }

            case 'updateStoriesStealthMode': {
                this.emit('updateStoriesStealthMode', update);
                break;
            }

            default:
                break;
        }
    };

    addTdLibListener = () => {
        TdLibController.addListener('update', this.onUpdate);
    };

    removeTdLibListener = () => {
        TdLibController.off('update', this.onUpdate);
    };
}

const store = new StoryStore();

// Carga inicial: al arrancar la app, pide la bandeja de stories activas
TdLibController.addListener('update', update => {
    if (
        update['@type'] === 'updateAuthorizationState' &&
        update.authorization_state?.['@type'] === 'authorizationStateReady'
    ) {
        TdLibController.send({ '@type': 'getActiveStories' })
            .then(result => {
                if (!result || !result.peers) return;
                for (const peer of result.peers) {
                    store._setPeerData(peer);
                }
                store.emit('updateActiveStories', { '@type': 'updateActiveStories', peers: result.peers });
            })
            .catch(e => console.warn('[StoryStore] getActiveStories failed', e));
    }
});

export default store;
