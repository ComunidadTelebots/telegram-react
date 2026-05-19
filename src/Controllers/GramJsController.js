/* global BigInt */
/*
 * GramJsController — reemplaza TdLibController usando GramJS (layer actual)
 * con la misma interfaz de eventos para que los stores no necesiten cambios.
 */

import { EventEmitter } from 'events';
import { unstable_batchedUpdates } from 'react-dom';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram';
import { computeCheck } from 'telegram/Password';
import packageJson from '../../package.json';
import { getBrowser, getOSName } from '../Utils/Common';
import { translateUpdate } from '../Utils/GramJs/UpdateTranslator';
import {
    translateUser,
    translateChat,
    translateMessage,
    translateSticker,
    entityToTdlibChatId,
    tdlibChatIdToInputPeer,
    translateStickerSetInfo,
    translateStickerSet,
    mediaCache
} from '../Utils/GramJs/EntityTranslator';
import { loadMessages, saveMessages } from '../Utils/MessageCache';

const ACCOUNTS_KEY = 'tg_gramjs_accounts';
const ACTIVE_ACCOUNT_KEY = 'tg_gramjs_active_account';
const SESSION_KEY_PREFIX = 'tg_gramjs_session_';
const SESSION_KEY_LEGACY = 'tg_gramjs_session'; // for migration

class GramJsController extends EventEmitter {
    constructor() {
        super();
        this.client = null;
        this.parameters = { useTestDC: false };
        this.disableLog = false;

        // Multi-account support — inline to avoid class-field ordering issues
        {
            const stored = localStorage.getItem(ACCOUNTS_KEY);
            let accounts = null;
            if (stored) {
                try {
                    accounts = JSON.parse(stored);
                } catch {}
            }
            if (!accounts) {
                const legacySession = localStorage.getItem(SESSION_KEY_LEGACY);
                if (legacySession) localStorage.setItem(`${SESSION_KEY_PREFIX}0`, legacySession);
                accounts = [{ index: 0, sessionKey: `${SESSION_KEY_PREFIX}0`, userId: null, name: null, phone: null }];
                localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
            }
            this._accounts = accounts;
        }
        this._activeAccountIndex = parseInt(localStorage.getItem(ACTIVE_ACCOUNT_KEY) || '0', 10);

        // Cachés locales para reverse-lookup
        this._entityCache = new Map(); // chatId → entity raw (para access hash)
        this._chatCache = new Map(); // chatId → TDLib chat object
        this._userCache = new Map(); // userId → TDLib user object

        this._downloadedFiles = new Map();
        this._downloadingFiles = new Set();

        this._initialDialogsLoaded = false;
        this._initialDialogsResolver = null;
        this._initialDialogsPromise = new Promise(resolve => {
            this._initialDialogsResolver = resolve;
        });

        // Chat folders (dialog filters)
        this._folderChats = new Map(); // folderId → Set<chatId>
        this._chatFilters = [];

        // Sticker set access hashes for getStickerSet lookups
        this._stickerSetAccessHashes = new Map(); // String(id) → BigInt accessHash

        // Auth state internos
        this._phone = null;
        this._phoneHash = null;
        this._addAccountPreviousIndex = null; // set while adding a new account

        this.setMaxListeners(Infinity);
    }

    // ─── Multi-account helpers ───────────────────────────────────────────────

    _saveAccounts = () => {
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(this._accounts));
        this.clientUpdate({
            '@type': 'clientUpdateAccounts',
            accounts: [...this._accounts],
            activeIndex: this._activeAccountIndex
        });
    };

    _getActiveSessionKey = () => {
        const account = this._accounts.find(a => a.index === this._activeAccountIndex);
        return account ? account.sessionKey : `${SESSION_KEY_PREFIX}0`;
    };

    _getNextAccountIndex = () => {
        const used = new Set(this._accounts.map(a => a.index));
        let i = 0;
        while (used.has(i)) i++;
        return i;
    };

    _saveAccountInfo = me => {
        const account = this._accounts.find(a => a.index === this._activeAccountIndex);
        if (account) {
            account.userId = Number(me.id);
            account.name = [me.firstName, me.lastName].filter(Boolean).join(' ') || null;
            account.phone = me.phone ? `+${me.phone}` : null;
            this._saveAccounts();
        }
    };

    _clearCaches = () => {
        this._entityCache.clear();
        this._chatCache.clear();
        this._userCache.clear();
        this._downloadedFiles.clear();
        this._downloadingFiles.clear();
        this._folderChats.clear();
        this._chatFilters = [];
        this._stickerSetAccessHashes.clear();
    };

    _switchToAccount = async index => {
        this._activeAccountIndex = index;
        localStorage.setItem(ACTIVE_ACCOUNT_KEY, String(index));
        try {
            if (this.client) await this.client.disconnect();
        } catch {}
        this._clearCaches();
        this._resetInitialDialogsPromise();
        this._emitUpdate({
            '@type': 'updateAuthorizationState',
            authorization_state: { '@type': 'authorizationStateLoggingOut' }
        });
        this._emitUpdate({
            '@type': 'updateAuthorizationState',
            authorization_state: { '@type': 'authorizationStateClosed' }
        });
        // ApplicationStore handles authorizationStateClosed → calls init() → _startClient()
    };

    getAccounts = () => this._accounts.map(a => ({ ...a }));

    isAddingAccount = () => this._addAccountPreviousIndex !== null;

    addAccount = async () => {
        this._addAccountPreviousIndex = this._activeAccountIndex;
        const nextIndex = this._getNextAccountIndex();
        this._accounts.push({
            index: nextIndex,
            sessionKey: `${SESSION_KEY_PREFIX}${nextIndex}`,
            userId: null,
            name: null,
            phone: null
        });
        this._saveAccounts();
        await this._switchToAccount(nextIndex);
    };

    cancelAddAccount = async () => {
        const prevIndex = this._addAccountPreviousIndex;
        this._addAccountPreviousIndex = null;
        const currentIndex = this._activeAccountIndex;
        // Remove the empty new account
        const account = this._accounts.find(a => a.index === currentIndex);
        if (account) localStorage.removeItem(account.sessionKey);
        this._accounts = this._accounts.filter(a => a.index !== currentIndex);
        this._saveAccounts();
        // Switch back to previous account
        const target =
            prevIndex !== null && this._accounts.find(a => a.index === prevIndex)
                ? prevIndex
                : this._accounts.length > 0
                ? this._accounts[0].index
                : null;
        if (target !== null) {
            await this._switchToAccount(target);
        } else {
            await this._logOut();
        }
    };

    switchAccount = async index => {
        if (index === this._activeAccountIndex) return;
        await this._switchToAccount(index);
    };

    removeAccount = async index => {
        const account = this._accounts.find(a => a.index === index);
        if (account) localStorage.removeItem(account.sessionKey);
        this._accounts = this._accounts.filter(a => a.index !== index);
        this._saveAccounts();

        if (this._activeAccountIndex === index) {
            const remaining = this._accounts[0];
            if (remaining) {
                await this._switchToAccount(remaining.index);
            } else {
                // No accounts left — full server-side logout
                await this._logOut();
            }
        }
    };

    // ─── Ciclo de vida ───────────────────────────────────────────────────────

    init = location => {
        this.clientUpdate({ '@type': 'clientUpdateTdLibDatabaseExists', exists: false });
        this._startClient();
    };

    _startClient = async () => {
        const apiId = parseInt(process.env.REACT_APP_TELEGRAM_API_ID, 10);
        const apiHash = process.env.REACT_APP_TELEGRAM_API_HASH;

        if (!apiId || !apiHash) {
            console.error('[GramJs] Faltan credenciales API. Configura .env');
            return;
        }

        // Simular el flujo de estados de auth que esperan los stores
        this._emitUpdate({
            '@type': 'updateAuthorizationState',
            authorization_state: { '@type': 'authorizationStateWaitTdlibParameters' }
        });

        this._clearCaches();
        const sessionKey = this._getActiveSessionKey();
        let savedSession = localStorage.getItem(sessionKey) || '';
        // Fallback: si la clave nueva está vacía, intentar con la clave legacy
        if (!savedSession) {
            const legacy = localStorage.getItem(SESSION_KEY_LEGACY) || '';
            if (legacy) {
                savedSession = legacy;
                localStorage.setItem(sessionKey, legacy);
            }
        }
        const session = new StringSession(savedSession);

        this.client = new TelegramClient(session, apiId, apiHash, this._buildClientOptions());

        try {
            await this.client.connect();
        } catch (err) {
            console.error('[GramJs] Error de conexión:', err);
            return;
        }

        this._saveSession();

        // Simular waitEncryptionKey para mantener compatibilidad con ApplicationStore
        this._emitUpdate({
            '@type': 'updateAuthorizationState',
            authorization_state: { '@type': 'authorizationStateWaitEncryptionKey' }
        });

        if (await this.client.isUserAuthorized()) {
            await this._onAuthorized();
        } else {
            this._emitUpdate({
                '@type': 'updateAuthorizationState',
                authorization_state: { '@type': 'authorizationStateWaitPhoneNumber' }
            });
        }
    };

    _onAuthorized = async () => {
        this._addAccountPreviousIndex = null; // clear add-account mode on successful login
        this._saveSession();
        this._setupUpdateHandler();

        this._emitUpdate({ '@type': 'updateConnectionState', state: { '@type': 'connectionStateConnecting' } });
        this._emitUpdate({ '@type': 'updateConnectionState', state: { '@type': 'connectionStateReady' } });
        this._emitUpdate({
            '@type': 'updateAuthorizationState',
            authorization_state: { '@type': 'authorizationStateReady' }
        });

        await this._loadInitialData();
    };

    _saveSession = () => {
        try {
            const str = this.client.session.save();
            if (str) localStorage.setItem(this._getActiveSessionKey(), str);
        } catch (e) {
            /* no-op */
        }
    };

    _setupUpdateHandler = () => {
        // Escuchar todos los updates raw de MTProto
        this.client.addEventHandler(event => {
            const raw = event.originalUpdate || event;
            if (!raw) return;

            // Actualizar usuarios/chats que vengan en el update
            if (raw.users) raw.users.forEach(u => this._cacheUser(u));
            if (raw.chats) raw.chats.forEach(c => this._cacheEntity(c));

            const tdUpdate = translateUpdate(raw);
            if (tdUpdate) this._emitUpdate(tdUpdate);
        });
    };

    _loadInitialData = async () => {
        try {
            const me = await this.client.getMe();
            this._cacheUser(me);
        } catch (e) {
            console.warn('[GramJs] No se pudo obtener usuario propio', e);
        }

        // Emitir updateOption con el user id propio y guardar info de cuenta
        const me = await this.client.getMe().catch(() => null);
        if (me) {
            this._saveAccountInfo(me);
            this._emitUpdate({
                '@type': 'updateOption',
                name: 'my_id',
                value: { '@type': 'optionValueInteger', value: Number(me.id) }
            });
        }

        // Cargar lista de diálogos inicial
        await this._loadDialogs();

        // Cargar carpetas (no bloquea si falla)
        this._loadDialogFilters().catch(() => {});
    };

    _loadDialogs = async (offsetDate = undefined, offsetId = undefined, limit = 100) => {
        try {
            const dialogs = await this.client.getDialogs({
                limit,
                offsetDate: offsetDate || undefined,
                offsetId: offsetId || undefined
            });

            for (const dialog of dialogs) {
                const entity = dialog.entity;
                if (!entity) continue;

                this._cacheEntity(entity);

                const cls = entity.className || entity._;

                if (cls === 'User') {
                    const tdUser = translateUser(entity);
                    if (tdUser) {
                        this._userCache.set(tdUser.id, tdUser);
                        this._emitUpdate({ '@type': 'updateUser', user: tdUser });
                    }
                } else if (cls === 'Chat' || cls === 'ChatForbidden') {
                    const status = entity.creator
                        ? { '@type': 'chatMemberStatusCreator', is_member: true }
                        : entity.left
                        ? { '@type': 'chatMemberStatusLeft' }
                        : { '@type': 'chatMemberStatusMember' };
                    this._emitUpdate({
                        '@type': 'updateBasicGroup',
                        basic_group: {
                            '@type': 'basicGroup',
                            id: Number(entity.id),
                            member_count: entity.participantsCount || 0,
                            status,
                            is_active: !entity.deactivated,
                            upgraded_to_supergroup_id: 0
                        }
                    });
                } else if (cls === 'Channel' || cls === 'ChannelForbidden') {
                    const status = entity.creator
                        ? { '@type': 'chatMemberStatusCreator', is_member: true }
                        : entity.left
                        ? { '@type': 'chatMemberStatusLeft' }
                        : entity.adminRights
                        ? {
                              '@type': 'chatMemberStatusAdministrator',
                              can_be_edited: false,
                              can_change_info: true,
                              can_post_messages: true,
                              can_edit_messages: true,
                              can_delete_messages: true,
                              can_invite_users: true,
                              can_restrict_members: true,
                              can_pin_messages: true,
                              can_promote_members: false
                          }
                        : { '@type': 'chatMemberStatusMember' };
                    this._emitUpdate({
                        '@type': 'updateSupergroup',
                        supergroup: {
                            '@type': 'supergroup',
                            id: Number(entity.id),
                            username: entity.username || '',
                            date: entity.date || 0,
                            status,
                            member_count: entity.participantsCount || 0,
                            has_linked_chat: false,
                            has_location: false,
                            sign_messages: !!entity.signatures,
                            is_slow_mode_enabled: false,
                            is_channel: !entity.megagroup,
                            is_verified: !!entity.verified,
                            restriction_reason: '',
                            is_scam: !!entity.scam
                        }
                    });
                }

                const tdChat = translateChat(entity, dialog);
                if (tdChat) {
                    this._chatCache.set(tdChat.id, tdChat);
                    this._emitUpdate({ '@type': 'updateNewChat', chat: tdChat });
                    if (tdChat.last_message) {
                        this._emitUpdate({
                            '@type': 'updateChatLastMessage',
                            chat_id: tdChat.id,
                            last_message: tdChat.last_message,
                            order: tdChat.order
                        });
                    }
                }
            }

            // Notificar que los diálogos están listos
            this.clientUpdate({ '@type': 'clientUpdateDialogsReady' });
        } catch (err) {
            console.error('[GramJs] Error cargando diálogos:', err);
        } finally {
            this._initialDialogsLoaded = true;
            if (this._initialDialogsResolver) {
                this._initialDialogsResolver();
            }
        }
    };

    _inputPeerToTdlibChatId = peer => {
        if (!peer) return null;
        const cls = peer.className;
        if (cls === 'InputPeerUser') return Number(peer.userId);
        if (cls === 'InputPeerChat') return -Number(peer.chatId);
        if (cls === 'InputPeerChannel') return -1000000000000 - Number(peer.channelId);
        return null;
    };

    _loadDialogFilters = async () => {
        try {
            const result = await this.client.invoke(new Api.messages.GetDialogFilters());
            const rawFilters = result.filters || result;
            const filterArray = Array.isArray(rawFilters) ? rawFilters : [rawFilters];

            const filters = [];
            for (const filter of filterArray) {
                const cls = filter.className;
                if (cls === 'DialogFilterDefault' || cls === 'DialogFilterChatlist') continue;
                if (!filter.id) continue;

                const chatIds = new Set();
                const peers = [...(filter.pinnedPeers || []), ...(filter.includePeers || [])];
                for (const peer of peers) {
                    const id = this._inputPeerToTdlibChatId(peer);
                    if (id !== null) chatIds.add(id);
                }

                const rawTitle = filter.title;
                const title = typeof rawTitle === 'string' ? rawTitle : rawTitle?.text || 'Folder';

                this._folderChats.set(filter.id, chatIds);
                filters.push({ id: filter.id, title });
            }

            this._chatFilters = filters;
            if (filters.length > 0) {
                this.clientUpdate({ '@type': 'clientUpdateChatFilters', filters });
            }
        } catch (e) {
            console.warn('[GramJs] getDialogFilters error:', e);
        }
    };

    _cacheEntity = entity => {
        if (!entity) return;
        const chatId = entityToTdlibChatId(entity);
        if (chatId) this._entityCache.set(chatId, entity);
    };

    _cacheUser = user => {
        if (!user) return;
        this._cacheEntity(user);
        const tdUser = translateUser(user);
        if (tdUser) this._userCache.set(tdUser.id, tdUser);
    };

    // ─── Interfaz pública (compatible con TdLibController) ──────────────────

    clientUpdate = update => {
        if (!this.disableLog) console.log('[GramJs] clientUpdate', update);
        unstable_batchedUpdates(() => this.emit('clientUpdate', update));
    };

    // Queue-based deferred batching: accumulates all synchronous _emitUpdate calls
    // from a single GramJS event and flushes them in ONE React render cycle via
    // a microtask. Prevents removeChild crashes caused by interleaved parent
    // (DialogsList reorder) and child (DialogContent forceUpdate) updates.
    _pendingUpdates = [];
    _flushScheduled = false;

    _emitUpdate = update => {
        if (!this.disableLog) console.log('[GramJs] update', update);
        this._pendingUpdates.push(update);
        if (!this._flushScheduled) {
            this._flushScheduled = true;
            Promise.resolve().then(this._flushPendingUpdates);
        }
    };

    _flushPendingUpdates = () => {
        this._flushScheduled = false;
        const updates = this._pendingUpdates.splice(0);
        unstable_batchedUpdates(() => {
            updates.forEach(u => this.emit('update', u));
        });
    };

    send = async request => {
        const type = request['@type'];
        if (!this.disableLog) console.log('[GramJs] send', request);

        try {
            return await this._dispatch(type, request);
        } catch (err) {
            console.error('[GramJs] send error', type, err);
            throw err;
        }
    };

    _dispatch = async (type, req) => {
        switch (type) {
            // ── No-ops (ya gestionados en init) ─────────────────────────────
            case 'setTdlibParameters':
            case 'checkDatabaseEncryptionKey':
            case 'setLogTagVerbosityLevel':
            case 'setOption':
                return {};

            // ── Auth ─────────────────────────────────────────────────────────
            case 'setAuthenticationPhoneNumber':
                return this._sendPhone(req);
            case 'checkAuthenticationCode':
                return this._checkCode(req);
            case 'checkAuthenticationPassword':
                return this._checkPassword(req);
            case 'resendAuthenticationCode':
                return this._resendCode();
            case 'requestQrCodeAuthentication':
                return {};
            case 'logOut':
                return this._logOut();

            // ── Multi-cuenta ──────────────────────────────────────────────────
            case 'getAccounts':
                return { '@type': 'accounts', accounts: this.getAccounts(), activeIndex: this._activeAccountIndex };
            case 'addAccount':
                await this.addAccount();
                return {};
            case 'switchAccount':
                await this.switchAccount(req.index);
                return {};
            case 'removeAccount':
                await this.removeAccount(req.index);
                return {};

            // ── Chats ─────────────────────────────────────────────────────────
            case 'getChats':
                return this._getChats(req);
            case 'getChat':
                return this._getChat(req);
            case 'searchPublicChat':
                return this._searchPublicChat(req);
            case 'createPrivateChat':
                return this._createPrivateChat(req);
            case 'getContacts':
                return this._getContacts();
            case 'createGroupChat':
                return this._createGroupChat(req);
            case 'createChannel':
                return this._createChannel(req);

            // ── Mensajes ──────────────────────────────────────────────────────
            case 'getChatHistory':
                return this._getChatHistory(req);
            case 'getMessages':
                return this._getMessages(req);
            case 'sendMessage':
                return this._sendMessage(req);
            case 'editMessageText':
                return this._editMessage(req);
            case 'deleteMessages':
                return this._deleteMessages(req);
            case 'viewMessages':
                return this._viewMessages(req);
            case 'readAllChatMentions':
                return {};

            // ── Usuarios ──────────────────────────────────────────────────────
            case 'getUser':
                return this._getUser(req);
            case 'getUserFullInfo':
                return this._getUserFullInfo(req);

            // ── Acciones ──────────────────────────────────────────────────────
            case 'sendChatAction':
                return this._sendChatAction(req);
            case 'toggleChatIsPinned':
                return this._togglePin(req);
            case 'setChatNotificationSettings':
                return {};
            case 'toggleChatIsMarkedAsUnread':
                return {};

            // ── Búsqueda ──────────────────────────────────────────────────────
            case 'searchMessages':
                return this._searchMessages(req);
            case 'searchChatMessages':
                return this._searchChatMessages(req);

            // ── Opciones de idioma ────────────────────────────────────────────
            case 'getLocalizationTargetInfo':
                return {
                    '@type': 'localizationTargetInfo',
                    language_packs: [
                        {
                            '@type': 'languagePackInfo',
                            id: 'en',
                            base_language_pack_id: '',
                            name: 'English',
                            native_name: 'English',
                            plural_code: 'en',
                            is_official: true,
                            is_rtl: false,
                            is_beta: false,
                            is_installed: true,
                            total_string_count: 0,
                            translated_string_count: 0,
                            translation_url: ''
                        },
                        {
                            '@type': 'languagePackInfo',
                            id: 'es',
                            base_language_pack_id: '',
                            name: 'Spanish',
                            native_name: 'Español',
                            plural_code: 'es',
                            is_official: true,
                            is_rtl: false,
                            is_beta: false,
                            is_installed: true,
                            total_string_count: 0,
                            translated_string_count: 0,
                            translation_url: ''
                        }
                    ]
                };
            case 'getLanguagePackInfo':
                return {
                    '@type': 'languagePackInfo',
                    id: 'en',
                    base_language_pack_id: '',
                    name: 'English',
                    native_name: 'English',
                    plural_code: 'en',
                    is_official: true,
                    is_rtl: false,
                    is_beta: false,
                    is_installed: true,
                    total_string_count: 0,
                    translated_string_count: 0,
                    translation_url: ''
                };
            case 'getLanguagePackStrings':
                return { '@type': 'languagePackStrings', strings: [] };
            case 'synchronizeLanguagePack':
                return {};

            // ── Stickers ──────────────────────────────────────────────────────
            case 'getInstalledStickerSets':
                return this._getInstalledStickerSets(req);
            case 'getStickerSet':
                return this._getStickerSet(req);
            case 'getRecentStickers':
                return this._getRecentStickers(req);

            // ── Notificaciones ────────────────────────────────────────────────
            case 'setNotificationGroup':
                return {};
            case 'removeNotification':
                return {};

            // ── Reacciones ────────────────────────────────────────────────────
            case 'sendMessageReaction':
                return this._sendReaction(req);

            // ── Archivos ──────────────────────────────────────────────────────
            case 'downloadFile':
                return this._downloadFile(req);
            case 'readFile':
                return this._readFile(req);
            case 'cancelDownloadFile':
            case 'uploadFile':
                return {};

            default:
                if (!this.disableLog) console.warn('[GramJs] send no implementado:', type);
                return {};
        }
    };

    // ─── Auth handlers ───────────────────────────────────────────────────────

    _buildClientOptions = (dcId = undefined) => ({
        ...(dcId !== undefined ? { dcId } : {}),
        connectionRetries: 10,
        retryDelay: 1000,
        useWSS: true,
        useIPV6: false,
        testMode: false,
        appVersion: packageJson.version,
        deviceModel: getBrowser(),
        systemVersion: getOSName(),
        langCode: navigator.language || 'en'
    });

    _sendPhone = async req => {
        const { phone_number } = req;
        const apiId = parseInt(process.env.REACT_APP_TELEGRAM_API_ID, 10);
        const apiHash = process.env.REACT_APP_TELEGRAM_API_HASH;

        console.log('[GramJs] sendCode →', phone_number);

        // Usamos invoke() directamente para que PHONE_MIGRATE nos llegue
        // (client.sendCode() lo intercepta y llama _switchDC que falla en WSS)
        const doSend = () =>
            this.client.invoke(
                new Api.auth.SendCode({
                    phoneNumber: phone_number,
                    apiId,
                    apiHash,
                    settings: new Api.CodeSettings({})
                })
            );

        let result;
        try {
            result = await doSend();
        } catch (err) {
            const errMsg = err.errorMessage || err.message || '';
            const dcMatch = errMsg.match(/PHONE_MIGRATE_(\d+)/i);
            if (dcMatch) {
                const dcId = parseInt(dcMatch[1], 10);
                console.log(`[GramJs] PHONE_MIGRATE_${dcId} — recreando cliente en DC${dcId}`);
                try {
                    await this.client.disconnect();
                } catch (_) {}

                this.client = new TelegramClient(new StringSession(''), apiId, apiHash, this._buildClientOptions(dcId));
                this._setupUpdateHandler();

                let connected = false;
                for (let attempt = 1; attempt <= 5; attempt++) {
                    try {
                        console.log(`[GramJs] Intentando conectar a DC${dcId} (intento ${attempt})...`);
                        await this.client.connect();
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        if (this.client.connected) {
                            connected = true;
                            break;
                        }
                    } catch (connErr) {
                        console.error(`[GramJs] Error al conectar a DC${dcId} en intento ${attempt}:`, connErr);
                        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                    }
                }

                if (!connected) {
                    throw new Error(`No se pudo conectar al DC${dcId} de destino.`);
                }

                let lastErr;
                for (let sendAttempt = 1; sendAttempt <= 5; sendAttempt++) {
                    try {
                        console.log(`[GramJs] Enviando código en DC${dcId} (intento ${sendAttempt})...`);
                        result = await doSend();
                        break;
                    } catch (sendErr) {
                        lastErr = sendErr;
                        console.warn(`[GramJs] Error al enviar código en DC${dcId} (intento ${sendAttempt}):`, sendErr);
                        if (sendErr.message?.includes('Not connected') || sendErr.message?.includes('network')) {
                            try {
                                await this.client.disconnect();
                            } catch (_) {}
                            await new Promise(resolve => setTimeout(resolve, 1500 * sendAttempt));
                            try {
                                await this.client.connect();
                            } catch (_) {}
                        } else {
                            throw sendErr;
                        }
                    }
                }
                if (!result) {
                    throw lastErr;
                }
            } else {
                throw err;
            }
        }

        console.log('[GramJs] sendCode ← phoneCodeHash:', result?.phoneCodeHash);
        this._phone = phone_number;
        this._phoneHash = result.phoneCodeHash;

        this._emitUpdate({
            '@type': 'updateAuthorizationState',
            authorization_state: {
                '@type': 'authorizationStateWaitCode',
                code_info: {
                    phone_number,
                    type: { '@type': 'authenticationCodeTypeTelegramMessage', length: 5 },
                    next_type: null,
                    timeout: 120
                }
            }
        });
        return {};
    };

    _checkCode = async req => {
        try {
            await this.client.invoke(
                new Api.auth.SignIn({
                    phoneNumber: this._phone,
                    phoneCodeHash: this._phoneHash,
                    phoneCode: req.code
                })
            );
            await this._onAuthorized();
        } catch (err) {
            if (err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
                this._emitUpdate({
                    '@type': 'updateAuthorizationState',
                    authorization_state: {
                        '@type': 'authorizationStateWaitPassword',
                        password_hint: '',
                        has_recovery_email_address: false,
                        recovery_email_address_pattern: ''
                    }
                });
                return {};
            }
            throw err;
        }
        return {};
    };

    _checkPassword = async req => {
        const passwordData = await this.client.invoke(new Api.account.GetPassword());
        const check = await computeCheck(passwordData, req.password);
        await this.client.invoke(new Api.auth.CheckPassword({ password: check }));
        await this._onAuthorized();
        return {};
    };

    _resendCode = async () => {
        if (this._phone && this._phoneHash) {
            await this.client.invoke(
                new Api.auth.ResendCode({ phoneNumber: this._phone, phoneCodeHash: this._phoneHash })
            );
        }
        return {};
    };

    _resetInitialDialogsPromise = () => {
        this._initialDialogsLoaded = false;
        this._initialDialogsPromise = new Promise(resolve => {
            this._initialDialogsResolver = resolve;
        });
    };

    _logOut = async () => {
        await this.client.invoke(new Api.auth.LogOut()).catch(() => {});
        localStorage.removeItem(this._getActiveSessionKey());
        // Remove current account from list
        this._accounts = this._accounts.filter(a => a.index !== this._activeAccountIndex);
        this._saveAccounts();

        // If another account exists, switch to it; otherwise full logout
        const remaining = this._accounts[0];
        if (remaining) {
            this._activeAccountIndex = remaining.index;
            localStorage.setItem(ACTIVE_ACCOUNT_KEY, String(remaining.index));
        }

        this._clearCaches();
        this._resetInitialDialogsPromise();
        this._emitUpdate({
            '@type': 'updateAuthorizationState',
            authorization_state: { '@type': 'authorizationStateLoggingOut' }
        });
        this._emitUpdate({
            '@type': 'updateAuthorizationState',
            authorization_state: { '@type': 'authorizationStateClosed' }
        });
        return {};
    };

    logOut = () => {
        this.send({ '@type': 'logOut' }).catch(err => this.emit('tdlib_auth_error', err));
    };

    // ─── Chat handlers ───────────────────────────────────────────────────────

    _getChats = async req => {
        const { chat_list } = req || {};

        if (chat_list && chat_list['@type'] === 'chatListFilter') {
            const folderSet = this._folderChats.get(chat_list.filter_id);
            const chatIds = folderSet ? Array.from(folderSet) : [];
            return { '@type': 'chats', total_count: chatIds.length, chat_ids: chatIds };
        }

        if (!this._initialDialogsLoaded && this._initialDialogsPromise) {
            await this._initialDialogsPromise;
        }
        const chatIds = Array.from(this._chatCache.keys());
        return { '@type': 'chats', total_count: chatIds.length, chat_ids: chatIds };
    };

    _getChat = async req => {
        const { chat_id } = req;
        const cached = this._chatCache.get(chat_id);
        if (cached) return cached;

        // Intentar obtener del servidor
        try {
            const inputPeer = tdlibChatIdToInputPeer(chat_id, this._entityCache);
            const entity = await this.client.getEntity(inputPeer);
            this._cacheEntity(entity);
            const tdChat = translateChat(entity, null);
            if (tdChat) {
                this._chatCache.set(tdChat.id, tdChat);
                return tdChat;
            }
        } catch (e) {
            /* no-op */
        }
        return null;
    };

    _searchPublicChat = async req => {
        const { username } = req;
        try {
            const entity = await this.client.getEntity(username);
            this._cacheEntity(entity);
            const tdChat = translateChat(entity, null);
            if (tdChat) {
                this._chatCache.set(tdChat.id, tdChat);
                this._emitUpdate({ '@type': 'updateNewChat', chat: tdChat });
                return tdChat;
            }
        } catch (e) {
            /* no-op */
        }
        return null;
    };

    _createPrivateChat = async req => {
        const { user_id } = req;
        const cached = this._chatCache.get(user_id);
        if (cached) return cached;
        try {
            const entity = await this.client.getEntity(
                new Api.InputUser({ userId: BigInt(user_id), accessHash: BigInt(0) })
            );
            this._cacheEntity(entity);
            const tdChat = translateChat(entity, null);
            if (tdChat) {
                this._chatCache.set(tdChat.id, tdChat);
                this._emitUpdate({ '@type': 'updateNewChat', chat: tdChat });
                return tdChat;
            }
        } catch (e) {
            /* no-op */
        }
        return null;
    };

    _getContacts = async () => {
        try {
            const result = await this.client.invoke(new Api.contacts.GetContacts({ hash: BigInt(0) }));
            const users = result.users || [];
            return users
                .filter(u => !(u.className === 'UserEmpty') && !u.deleted && !u.bot)
                .map(u => {
                    const tdUser = translateUser(u);
                    if (tdUser) {
                        this._userCache.set(tdUser.id, tdUser);
                        this._cacheEntity(u);
                    }
                    return tdUser;
                })
                .filter(Boolean);
        } catch (e) {
            console.error('[GramJs] getContacts error:', e);
            return [];
        }
    };

    _createGroupChat = async req => {
        const { title, user_ids } = req;
        try {
            const users = user_ids.map(id => {
                const entity = this._entityCache.get(id);
                if (entity && entity.accessHash !== undefined) {
                    return new Api.InputUser({ userId: BigInt(id), accessHash: entity.accessHash });
                }
                return new Api.InputUser({ userId: BigInt(id), accessHash: BigInt(0) });
            });
            const result = await this.client.invoke(new Api.messages.CreateChat({ users, title }));
            const newChat = (result.chats || [])[0];
            if (!newChat) return null;
            this._cacheEntity(newChat);
            this._emitUpdate({
                '@type': 'updateBasicGroup',
                basic_group: {
                    '@type': 'basicGroup',
                    id: Number(newChat.id),
                    member_count: user_ids.length + 1,
                    status: { '@type': 'chatMemberStatusCreator', is_member: true },
                    is_active: true,
                    upgraded_to_supergroup_id: 0
                }
            });
            const tdChat = translateChat(newChat, null);
            if (tdChat) {
                this._chatCache.set(tdChat.id, tdChat);
                this._emitUpdate({ '@type': 'updateNewChat', chat: tdChat });
                return tdChat;
            }
        } catch (e) {
            console.error('[GramJs] createGroupChat error:', e);
            throw e;
        }
        return null;
    };

    _createChannel = async req => {
        const { title, about, is_channel } = req;
        try {
            const result = await this.client.invoke(
                new Api.channels.CreateChannel({
                    title,
                    about: about || '',
                    broadcast: !!is_channel,
                    megagroup: !is_channel
                })
            );
            const newChat = (result.chats || [])[0];
            if (!newChat) return null;
            this._cacheEntity(newChat);
            this._emitUpdate({
                '@type': 'updateSupergroup',
                supergroup: {
                    '@type': 'supergroup',
                    id: Number(newChat.id),
                    username: newChat.username || '',
                    date: newChat.date || 0,
                    status: { '@type': 'chatMemberStatusCreator', is_member: true },
                    member_count: 1,
                    has_linked_chat: false,
                    has_location: false,
                    sign_messages: false,
                    is_slow_mode_enabled: false,
                    is_channel: !!is_channel,
                    is_verified: false,
                    restriction_reason: '',
                    is_scam: false
                }
            });
            const tdChat = translateChat(newChat, null);
            if (tdChat) {
                this._chatCache.set(tdChat.id, tdChat);
                this._emitUpdate({ '@type': 'updateNewChat', chat: tdChat });
                return tdChat;
            }
        } catch (e) {
            console.error('[GramJs] createChannel error:', e);
            throw e;
        }
        return null;
    };

    // ─── Message handlers ────────────────────────────────────────────────────

    _doFetchChatHistory = async (chatId, fromMessageId, offset, limit) => {
        const inputPeer = tdlibChatIdToInputPeer(chatId, this._entityCache);
        const msgs = await this.client.getMessages(inputPeer, {
            limit,
            offsetId: fromMessageId || 0,
            addOffset: offset
        });
        const messages = msgs.map(m => translateMessage(m, chatId)).filter(Boolean);
        return { '@type': 'messages', messages, total_count: messages.length };
    };

    _refreshMessagesInBackground = async (chatId, cachedMessages, limit) => {
        // Small delay so React renders the cached messages and sets completed=true
        await new Promise(r => setTimeout(r, 250));
        try {
            const result = await this._doFetchChatHistory(chatId, 0, 0, limit);
            if (!result.messages.length) return;

            saveMessages(chatId, result.messages);

            const cachedIds = new Set(cachedMessages.map(m => m.id));
            result.messages
                .filter(m => !cachedIds.has(m.id))
                .forEach(m => this._emitUpdate({ '@type': 'updateNewMessage', message: m }));
        } catch (e) {
            // background refresh failed — not critical
        }
    };

    _getChatHistory = async req => {
        const { chat_id, from_message_id = 0, offset = 0, limit = 30 } = req;
        const isInitialLoad = from_message_id === 0 && offset === 0;

        if (isInitialLoad) {
            const cached = await loadMessages(chat_id);
            if (cached && cached.length > 0) {
                this._refreshMessagesInBackground(chat_id, cached, limit);
                return { '@type': 'messages', messages: cached, total_count: cached.length };
            }
        }

        try {
            const result = await this._doFetchChatHistory(chat_id, from_message_id, offset, limit);
            if (isInitialLoad && result.messages.length > 0) {
                saveMessages(chat_id, result.messages);
            }
            return result;
        } catch (err) {
            console.warn('[GramJs] getChatHistory error', err);
            return { '@type': 'messages', messages: [], total_count: 0 };
        }
    };

    _getMessages = async req => {
        const { chat_id, message_ids } = req;
        try {
            const inputPeer = tdlibChatIdToInputPeer(chat_id, this._entityCache);
            const msgs = await this.client.getMessages(inputPeer, { ids: message_ids });
            const messages = msgs.map(m => translateMessage(m, chat_id)).filter(Boolean);
            return { '@type': 'messages', messages, total_count: messages.length };
        } catch (err) {
            return { '@type': 'messages', messages: [], total_count: 0 };
        }
    };

    _sendMessage = async req => {
        const { chat_id, input_message_content, reply_to_message_id = 0, schedule_date } = req;
        const contentType = input_message_content?.['@type'];

        try {
            const inputPeer = tdlibChatIdToInputPeer(chat_id, this._entityCache);

            if (
                contentType === 'inputMessageDocument' ||
                contentType === 'inputMessageVoiceNote' ||
                contentType === 'inputMessageAudio' ||
                contentType === 'inputMessagePhoto'
            ) {
                return this._sendFile(chat_id, inputPeer, input_message_content, reply_to_message_id, schedule_date);
            }

            const text = input_message_content?.text?.text || '';
            const result = await this.client.sendMessage(inputPeer, {
                message: text,
                replyTo: reply_to_message_id || undefined,
                parseMode: undefined,
                scheduleDate: schedule_date || undefined
            });

            const tdMessage = translateMessage(result, chat_id);
            if (tdMessage) {
                this._emitUpdate({ '@type': 'updateNewMessage', message: tdMessage });
                return tdMessage;
            }
        } catch (err) {
            console.error('[GramJs] sendMessage error', err);
            throw err;
        }
        return {};
    };

    _sendFile = async (chatId, inputPeer, content, replyToMessageId, scheduleDate) => {
        const contentType = content['@type'];
        try {
            let file, caption, voiceNote, attributes;

            if (contentType === 'inputMessageDocument') {
                file = content.document?.data;
                caption = content.caption?.text || '';
            } else if (contentType === 'inputMessageVoiceNote') {
                const raw = content.voice_note?.data;
                file = raw instanceof File ? raw : new File([raw], 'voice.webm', { type: 'audio/webm' });
                voiceNote = true;
                caption = '';
                attributes = [new Api.DocumentAttributeAudio({ voice: true, duration: content.duration || 0 })];
            } else if (contentType === 'inputMessageAudio') {
                file = content.audio?.data;
                caption = content.caption?.text || '';
                attributes = [
                    new Api.DocumentAttributeAudio({
                        duration: content.duration || 0,
                        title: content.title || '',
                        performer: content.performer || ''
                    })
                ];
            } else if (contentType === 'inputMessagePhoto') {
                file = content.photo?.data;
                caption = content.caption?.text || '';
            }

            if (!file) return {};

            const result = await this.client.sendFile(inputPeer, {
                file,
                caption: caption || '',
                replyTo: replyToMessageId || undefined,
                voiceNote: voiceNote || false,
                attributes: attributes && attributes.length ? attributes : undefined,
                scheduleDate: scheduleDate || undefined,
                workers: 1
            });

            const tdMessage = translateMessage(result, chatId);
            if (tdMessage) {
                this._emitUpdate({ '@type': 'updateNewMessage', message: tdMessage });
                return tdMessage;
            }
        } catch (err) {
            console.error('[GramJs] sendFile error', contentType, err);
            throw err;
        }
        return {};
    };

    _editMessage = async req => {
        const { chat_id, message_id, input_message_content } = req;
        try {
            const inputPeer = tdlibChatIdToInputPeer(chat_id, this._entityCache);
            const text = input_message_content?.text?.text || '';
            await this.client.invoke(
                new Api.messages.EditMessage({
                    peer: inputPeer,
                    id: message_id,
                    message: text
                })
            );
        } catch (err) {
            throw err;
        }
        return {};
    };

    _deleteMessages = async req => {
        const { chat_id, message_ids, revoke = false } = req;
        try {
            const inputPeer = tdlibChatIdToInputPeer(chat_id, this._entityCache);
            if (chat_id < -1000000000000) {
                // Canal
                await this.client.invoke(new Api.channels.DeleteMessages({ channel: inputPeer, id: message_ids }));
            } else {
                await this.client.invoke(new Api.messages.DeleteMessages({ id: message_ids, revoke }));
            }
        } catch (err) {
            throw err;
        }
        return {};
    };

    _viewMessages = async req => {
        const { chat_id, message_ids } = req;
        try {
            const inputPeer = tdlibChatIdToInputPeer(chat_id, this._entityCache);
            if (chat_id < -1000000000000) {
                await this.client.invoke(
                    new Api.channels.ReadHistory({ channel: inputPeer, maxId: Math.max(...message_ids) })
                );
            } else {
                await this.client.invoke(
                    new Api.messages.ReadHistory({ peer: inputPeer, maxId: Math.max(...message_ids) })
                );
            }
        } catch (e) {
            /* no-op */
        }
        return {};
    };

    // ─── User handlers ────────────────────────────────────────────────────────

    _getUser = async req => {
        const { user_id } = req;
        const cached = this._userCache.get(user_id);
        if (cached) return cached;
        try {
            const entity = await this.client.getEntity(
                new Api.InputUser({ userId: BigInt(user_id), accessHash: BigInt(0) })
            );
            const tdUser = translateUser(entity);
            if (tdUser) {
                this._userCache.set(tdUser.id, tdUser);
                return tdUser;
            }
        } catch (e) {
            /* no-op */
        }
        return null;
    };

    _getUserFullInfo = async req => {
        const { user_id } = req;
        try {
            const result = await this.client.invoke(
                new Api.users.GetFullUser({
                    id: new Api.InputUser({
                        userId: BigInt(user_id),
                        accessHash: this._entityCache.get(user_id)?.accessHash || BigInt(0)
                    })
                })
            );
            const full = result.fullUser || result;
            return {
                '@type': 'userFullInfo',
                bio: full.about || '',
                supports_calls: true,
                has_private_calls: !!full.phoneCallsPrivate,
                has_private_forwards: false,
                need_phone_number_privacy_exception: false,
                commands: []
            };
        } catch (e) {
            /* no-op */
        }
        return {
            '@type': 'userFullInfo',
            bio: '',
            supports_calls: false,
            has_private_calls: false,
            has_private_forwards: false,
            need_phone_number_privacy_exception: false,
            commands: []
        };
    };

    // ─── Action handlers ─────────────────────────────────────────────────────

    _sendChatAction = async req => {
        const { chat_id, action } = req;
        try {
            const inputPeer = tdlibChatIdToInputPeer(chat_id, this._entityCache);
            let mtAction = new Api.SendMessageTypingAction();
            if (action?.['@type'] === 'chatActionUploadingDocument')
                mtAction = new Api.SendMessageUploadDocumentAction({ progress: 0 });
            if (action?.['@type'] === 'chatActionRecordingVideo') mtAction = new Api.SendMessageRecordVideoAction();
            await this.client.invoke(new Api.messages.SetTyping({ peer: mtAction, action: mtAction }));
        } catch (e) {
            /* no-op */
        }
        return {};
    };

    _togglePin = async req => {
        const { chat_list, chat_id, is_pinned } = req;
        try {
            const inputPeer = tdlibChatIdToInputPeer(chat_id, this._entityCache);
            await this.client.invoke(
                new Api.messages.ToggleDialogPin({
                    peer: new Api.InputDialogPeer({ peer: inputPeer }),
                    pinned: is_pinned
                })
            );
        } catch (e) {
            /* no-op */
        }
        return {};
    };

    _searchMessages = async req => {
        const { query, limit = 20 } = req;
        try {
            const result = await this.client.invoke(
                new Api.messages.SearchGlobal({
                    q: query,
                    filter: new Api.InputMessagesFilterEmpty(),
                    minDate: 0,
                    maxDate: 0,
                    offsetRate: 0,
                    offsetPeer: new Api.InputPeerEmpty(),
                    offsetId: 0,
                    limit
                })
            );
            return { '@type': 'messages', messages: [], total_count: 0 };
        } catch (e) {
            /* no-op */
        }
        return { '@type': 'messages', messages: [], total_count: 0 };
    };

    _searchChatMessages = async req => {
        const { chat_id, query, limit = 20, from_message_id = 0 } = req;
        try {
            const inputPeer = tdlibChatIdToInputPeer(chat_id, this._entityCache);
            const msgs = await this.client.invoke(
                new Api.messages.Search({
                    peer: inputPeer,
                    q: query,
                    filter: new Api.InputMessagesFilterEmpty(),
                    minDate: 0,
                    maxDate: 0,
                    offsetId: from_message_id,
                    addOffset: 0,
                    limit,
                    maxId: 0,
                    minId: 0,
                    hash: BigInt(0)
                })
            );
            const messages = (msgs.messages || []).map(m => translateMessage(m, chat_id)).filter(Boolean);
            return { '@type': 'messages', messages, total_count: messages.length };
        } catch (e) {
            /* no-op */
        }
        return { '@type': 'messages', messages: [], total_count: 0 };
    };

    // ─── Reaction handlers ───────────────────────────────────────────────────

    _sendReaction = async req => {
        const { chat_id, message_id, reaction } = req;
        try {
            const inputPeer = tdlibChatIdToInputPeer(chat_id, this._entityCache);
            await this.client.invoke(
                new Api.messages.SendReaction({
                    peer: inputPeer,
                    msgId: message_id,
                    reaction: reaction ? [new Api.ReactionEmoji({ emoticon: reaction })] : []
                })
            );
        } catch (err) {
            console.error('[GramJs] sendReaction error', err);
        }
        return {};
    };

    // ─── File handlers ───────────────────────────────────────────────────────

    // ─── Sticker APIs ────────────────────────────────────────────────────────

    _getInstalledStickerSets = async req => {
        try {
            const result = await this.client.invoke(new Api.messages.GetAllStickers({ hash: BigInt(0) }));
            const sets = (result.sets || []).map(ss => {
                this._stickerSetAccessHashes.set(String(ss.id), ss.accessHash);
                return translateStickerSetInfo(ss);
            });
            return { '@type': 'stickerSets', total_count: sets.length, sets };
        } catch (e) {
            console.warn('[GramJs] getInstalledStickerSets error', e);
            return { '@type': 'stickerSets', total_count: 0, sets: [] };
        }
    };

    _getStickerSet = async req => {
        try {
            const { set_id } = req;
            const idStr = String(set_id);
            const accessHash = this._stickerSetAccessHashes.get(idStr) || BigInt(0);
            const result = await this.client.invoke(
                new Api.messages.GetStickerSet({
                    stickerset: new Api.InputStickerSetID({
                        id: BigInt(idStr),
                        accessHash
                    }),
                    hash: 0
                })
            );
            return (
                translateStickerSet(result) || {
                    '@type': 'stickerSet',
                    id: idStr,
                    title: '',
                    name: '',
                    stickers: [],
                    emojis: []
                }
            );
        } catch (e) {
            console.warn('[GramJs] getStickerSet error', e);
            return {
                '@type': 'stickerSet',
                id: String(req.set_id || '0'),
                title: '',
                name: '',
                stickers: [],
                emojis: []
            };
        }
    };

    _getRecentStickers = async req => {
        try {
            const result = await this.client.invoke(
                new Api.messages.GetRecentStickers({ attached: false, hash: BigInt(0) })
            );
            const stickers = (result.stickers || []).map(doc => translateSticker(doc)).filter(Boolean);
            return { '@type': 'stickers', stickers };
        } catch (e) {
            return { '@type': 'stickers', stickers: [] };
        }
    };

    _emitUpdateFile = (fileId, blob, isComplete = false, isActive = false) => {
        const size = blob ? blob.size : 0;
        this._emitUpdate({
            '@type': 'updateFile',
            file: {
                '@type': 'file',
                id: fileId,
                size,
                expected_size: size,
                local: {
                    '@type': 'localFile',
                    path: '',
                    can_be_downloaded: !isComplete,
                    can_be_deleted: false,
                    is_downloading_active: isActive,
                    is_downloading_completed: isComplete,
                    downloaded_prefix_size: isComplete ? size : 0,
                    downloaded_size: isComplete ? size : 0
                },
                remote: {
                    '@type': 'remoteFile',
                    id: String(fileId),
                    unique_id: String(fileId),
                    is_uploading_active: false,
                    is_uploading_completed: true,
                    uploaded_size: size
                }
            }
        });
    };

    _downloadFile = async req => {
        const { file_id } = req;
        const fileId = typeof file_id === 'number' ? file_id : Number(file_id);

        if (this._downloadedFiles.has(fileId)) {
            this._emitUpdateFile(fileId, this._downloadedFiles.get(fileId), true);
            return { '@type': 'file', id: fileId };
        }
        if (this._downloadingFiles.has(fileId)) {
            return { '@type': 'file', id: fileId };
        }

        const gMedia = mediaCache.get(fileId);
        if (!gMedia) {
            console.warn('[GramJs] downloadFile: sin entrada en mediaCache para', fileId);
            return { '@type': 'file', id: fileId };
        }

        this._downloadingFiles.add(fileId);
        this._emitUpdateFile(fileId, null, false, true);

        try {
            const cls = gMedia.className || gMedia._;
            let inputLocation;
            const dcId = gMedia.dcId;

            if (cls === 'Photo') {
                const biggestSize = (gMedia.sizes || []).slice(-1)[0];
                inputLocation = new Api.InputPhotoFileLocation({
                    id: gMedia.id,
                    accessHash: gMedia.accessHash,
                    fileReference: gMedia.fileReference,
                    thumbSize: biggestSize ? biggestSize.type : 'x'
                });
            } else {
                inputLocation = new Api.InputDocumentFileLocation({
                    id: gMedia.id,
                    accessHash: gMedia.accessHash,
                    fileReference: gMedia.fileReference,
                    thumbSize: ''
                });
            }

            const fileSize = gMedia.size ? Number(gMedia.size) : 0;
            const buffer = await this.client.downloadFile(inputLocation, { dcId, fileSize, workers: 1 });
            const blob = new Blob([buffer]);
            this._downloadedFiles.set(fileId, blob);
            this._downloadingFiles.delete(fileId);
            this._emitUpdateFile(fileId, blob, true);
        } catch (err) {
            console.error('[GramJs] downloadFile error', fileId, err);
            this._downloadingFiles.delete(fileId);
            this._emitUpdateFile(fileId, null, false);
        }

        return { '@type': 'file', id: fileId };
    };

    _readFile = async req => {
        const { file_id } = req;
        const fileId = typeof file_id === 'number' ? file_id : Number(file_id);
        // Return the Blob directly so FileStore.setBlob stores a real Blob.
        // The old binary-string path caused URL.createObjectURL to fail.
        const blob = this._downloadedFiles.get(fileId) || null;
        return { '@type': 'filePart', data: blob };
    };

    // ─── Compatibilidad con TdLibController ─────────────────────────────────

    setChatId = (chatId, messageId = null) => {
        this.clientUpdate({ '@type': 'clientUpdateChatId', chatId, messageId });
    };

    setMediaViewerContent = content => {
        this.clientUpdate({ '@type': 'clientUpdateMediaViewerContent', content });
    };

    sendTdParameters = async () => {
        // No-op: en GramJS los parámetros se pasan al constructor del cliente
    };
}

const controller = new GramJsController();
window.controller = controller;
export default controller;
