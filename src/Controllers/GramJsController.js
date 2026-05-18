/* global BigInt */
/*
 * GramJsController — reemplaza TdLibController usando GramJS (layer actual)
 * con la misma interfaz de eventos para que los stores no necesiten cambios.
 */

import { EventEmitter } from 'events';
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
    entityToTdlibChatId,
    tdlibChatIdToInputPeer
} from '../Utils/GramJs/EntityTranslator';

const SESSION_KEY = 'tg_gramjs_session';

class GramJsController extends EventEmitter {
    constructor() {
        super();
        this.client = null;
        this.parameters = { useTestDC: false };
        this.disableLog = false;

        // Cachés locales para reverse-lookup
        this._entityCache = new Map(); // chatId → entity raw (para access hash)
        this._chatCache = new Map(); // chatId → TDLib chat object
        this._userCache = new Map(); // userId → TDLib user object

        this._initialDialogsLoaded = false;
        this._initialDialogsResolver = null;
        this._initialDialogsPromise = new Promise(resolve => {
            this._initialDialogsResolver = resolve;
        });

        // Auth state internos
        this._phone = null;
        this._phoneHash = null;

        this.setMaxListeners(Infinity);
    }

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

        const savedSession = localStorage.getItem(SESSION_KEY) || '';
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
            if (str) localStorage.setItem(SESSION_KEY, str);
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

        // Emitir updateOption con el user id propio
        const me = await this.client.getMe().catch(() => null);
        if (me) {
            this._emitUpdate({
                '@type': 'updateOption',
                name: 'my_id',
                value: { '@type': 'optionValueInteger', value: Number(me.id) }
            });
        }

        // Cargar lista de diálogos inicial
        await this._loadDialogs();
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

                // Emitir usuario/grupo si es privado
                if ((entity.className || entity._) === 'User') {
                    const tdUser = translateUser(entity);
                    if (tdUser) {
                        this._userCache.set(tdUser.id, tdUser);
                        this._emitUpdate({ '@type': 'updateUser', user: tdUser });
                    }
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
        this.emit('clientUpdate', update);
    };

    _emitUpdate = update => {
        if (!this.disableLog) console.log('[GramJs] update', update);
        this.emit('update', update);
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

            // ── Chats ─────────────────────────────────────────────────────────
            case 'getChats':
                return this._getChats(req);
            case 'getChat':
                return this._getChat(req);
            case 'searchPublicChat':
                return this._searchPublicChat(req);
            case 'createPrivateChat':
                return this._createPrivateChat(req);

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
                return { '@type': 'stickerSets', total_count: 0, sets: [] };
            case 'getRecentStickers':
                return { '@type': 'stickers', stickers: [] };

            // ── Notificaciones ────────────────────────────────────────────────
            case 'setNotificationGroup':
                return {};
            case 'removeNotification':
                return {};

            // ── Archivos ──────────────────────────────────────────────────────
            case 'downloadFile':
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
        localStorage.removeItem(SESSION_KEY);
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

    // ─── Message handlers ────────────────────────────────────────────────────

    _getChatHistory = async req => {
        const { chat_id, from_message_id = 0, offset = 0, limit = 30 } = req;
        try {
            const inputPeer = tdlibChatIdToInputPeer(chat_id, this._entityCache);
            const msgs = await this.client.getMessages(inputPeer, {
                limit,
                offsetId: from_message_id || 0,
                addOffset: offset
            });

            const messages = msgs.map(m => translateMessage(m, chat_id)).filter(Boolean);

            return { '@type': 'messages', messages, total_count: messages.length };
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
        const { chat_id, input_message_content, reply_to_message_id = 0 } = req;
        try {
            const inputPeer = tdlibChatIdToInputPeer(chat_id, this._entityCache);
            const text = input_message_content?.text?.text || '';

            const result = await this.client.sendMessage(inputPeer, {
                message: text,
                replyTo: reply_to_message_id || undefined,
                parseMode: undefined
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
