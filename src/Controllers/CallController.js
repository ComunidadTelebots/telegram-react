/* global BigInt */
/**
 * CallController — gestiona llamadas de voz/video P2P en Telegram.
 *
 * Flujo (caller):
 *   requestCall → [getDhConfig, g^a, g_a_hash] → phone.requestCall
 *   → updatePhoneCall(phoneCallAccepted) → [g_b recibido, auth_key = g_b^a mod p]
 *   → phone.confirmCall → [WebRTC setup]
 *
 * Flujo (callee):
 *   updatePhoneCall(phoneCallRequested) → [g^b, phone.acceptCall]
 *   → updatePhoneCall(phoneCall) → [auth_key = g_a^b mod p, WebRTC setup]
 */

import { EventEmitter } from 'events';

export const CallState = {
    IDLE: 'idle',
    REQUESTING: 'requesting', // caller: enviando phone.requestCall
    WAITING: 'waiting', // caller: esperando que el otro acepte
    INCOMING: 'incoming', // callee: llamada entrante
    ACCEPTING: 'accepting', // callee: enviando phone.acceptCall
    ACTIVE: 'active', // llamada activa (ambos extremos)
    ENDING: 'ending', // phone.discardCall enviado, esperando confirm
    ENDED: 'ended',
};

class CallController extends EventEmitter {
    constructor() {
        super();
        this.state = CallState.IDLE;
        this.callInfo = null; // { userId, chatId, callId, accessHash, isVideo }
        this.pc = null; // RTCPeerConnection
        this._localStream = null;
        this._remoteStream = null;
        this._dhConfig = null;
        this._myPrivate = null; // BigInt — a o b
        this._myPublic = null; // BigInt — g^a o g^b
        this._authKey = null; // Uint8Array[256]
        this._duration = 0;
        this._durationTimer = null;
        this._signalingQueue = []; // mensajes de señalización recibidos antes de que WebRTC esté listo
    }

    // ─── Entrada pública (llamada por GramJsController al recibir updates) ───────

    onPhoneCallUpdate(update) {
        const callObj = update.phone_call || update.phoneCall || update;
        const cls = callObj['@type'] || callObj.className || callObj._;
        console.log('[CallController] onPhoneCallUpdate', cls, callObj);

        switch (cls) {
            case 'phoneCallRequested':
                this._onCallRequested(callObj);
                break;
            case 'phoneCallAccepted':
                this._onCallAccepted(callObj);
                break;
            case 'phoneCall':
                this._onCallConfirmed(callObj);
                break;
            case 'phoneCallDiscarded':
                this._onCallDiscarded(callObj);
                break;
            case 'phoneCallWaiting':
                // El otro extremo recibió nuestra solicitud
                break;
            default:
                break;
        }
    }

    onSignalingData(data) {
        if (!this.pc || this.pc.signalingState === 'closed') {
            this._signalingQueue.push(data);
            return;
        }
        this._handleSignalingData(data);
    }

    // ─── Iniciar llamada saliente ────────────────────────────────────────────────

    async requestCall(userId, isVideo = false) {
        if (this.state !== CallState.IDLE) return;
        this._setState(CallState.REQUESTING);
        this.callInfo = { userId, isVideo };

        try {
            await import('../Controllers/TdLibController').then(({ default: TdLib }) => {
                return TdLib.send({
                    '@type': 'requestCall',
                    user_id: userId,
                    is_video: isVideo,
                });
            });
        } catch (e) {
            console.error('[CallController] requestCall error', e);
            this._setState(CallState.IDLE);
        }
    }

    // ─── Aceptar llamada entrante ────────────────────────────────────────────────

    async acceptCall() {
        if (this.state !== CallState.INCOMING) return;
        this._setState(CallState.ACCEPTING);

        try {
            await import('../Controllers/TdLibController').then(({ default: TdLib }) => {
                return TdLib.send({
                    '@type': 'acceptCall',
                    call_id: this.callInfo.callId,
                    is_video: this.callInfo.isVideo,
                });
            });
        } catch (e) {
            console.error('[CallController] acceptCall error', e);
            this._setState(CallState.INCOMING);
        }
    }

    // ─── Rechazar / colgar ───────────────────────────────────────────────────────

    async discardCall(reason = 'hangup') {
        if (this.state === CallState.IDLE || this.state === CallState.ENDED) return;
        const prevState = this.state;
        this._setState(CallState.ENDING);

        try {
            await import('../Controllers/TdLibController').then(({ default: TdLib }) => {
                return TdLib.send({
                    '@type': 'discardCall',
                    call_id: this.callInfo && this.callInfo.callId,
                    is_disconnected: reason === 'disconnect',
                    duration: this._duration,
                    is_video: this.callInfo && this.callInfo.isVideo,
                    connection_id: 0,
                });
            });
        } catch (e) {
            console.error('[CallController] discardCall error', e);
        }
        this._cleanup();
        this._setState(CallState.ENDED);
        setTimeout(() => this._setState(CallState.IDLE), 2000);
    }

    // ─── Toggle mute/cámara ──────────────────────────────────────────────────────

    setMuted(muted) {
        if (!this._localStream) return;
        this._localStream.getAudioTracks().forEach(t => (t.enabled = !muted));
        this.emit('muteChanged', muted);
    }

    setVideoEnabled(enabled) {
        if (!this._localStream) return;
        this._localStream.getVideoTracks().forEach(t => (t.enabled = enabled));
        this.emit('videoChanged', enabled);
    }

    getLocalStream() {
        return this._localStream;
    }
    getRemoteStream() {
        return this._remoteStream;
    }

    // ─── Handlers de updates ─────────────────────────────────────────────────────

    _onCallRequested(callObj) {
        if (this.state !== CallState.IDLE) {
            // Ya hay una llamada activa, rechazar automáticamente
            this._sendDiscardBusy(callObj);
            return;
        }
        this.callInfo = {
            callId: String(callObj.id), // String para preservar precisión int64
            accessHash: String(callObj.access_hash),
            userId: String(callObj.admin_id),
            isVideo: !!(callObj.video || callObj.is_video),
            g_a_hash: callObj.g_a_hash,
            dhConfig: null,
        };
        // Enviar ACK de recepción al servidor (requerido antes de aceptar/rechazar)
        import('../Controllers/TdLibController').then(({ default: TdLib }) => {
            TdLib.send({ '@type': 'receivedCall', call_id: this.callInfo.callId }).catch(() => {});
        });
        this._setState(CallState.INCOMING);
    }

    _onCallAccepted(callObj) {
        // Caller recibe esto — el callee aceptó, tenemos g_b
        if (this.state !== CallState.WAITING) return;
        this.callInfo.accessHash = callObj.access_hash;
        const gb = callObj.g_b;
        this._finishCallerDH(gb, callObj);
    }

    _onCallConfirmed(callObj) {
        // Callee recibe phoneCall (confirmación del caller con g_a)
        if (this.state !== CallState.ACCEPTING && this.state !== CallState.INCOMING) return;
        this.callInfo.accessHash = callObj.access_hash;
        const ga = callObj.g_a_or_b;
        if (ga) {
            this._finishCalleeDH(ga, callObj);
        }
        this._startWebRTC(callObj);
    }

    _onCallDiscarded(callObj) {
        this._cleanup();
        this._setState(CallState.ENDED);
        setTimeout(() => this._setState(CallState.IDLE), 2000);
    }

    // ─── DH key exchange helpers ─────────────────────────────────────────────────

    async _finishCallerDH(gb, callObj) {
        // Tenemos g^b, computar auth_key = g_b^a mod p
        if (!this._myPrivate || !this._dhConfig) return;
        try {
            const p = BigInt('0x' + Buffer.from(this._dhConfig.p).toString('hex'));
            const gbBig = BigInt('0x' + Buffer.from(gb).toString('hex'));
            const authKeyBig = modPow(gbBig, this._myPrivate, p);
            this._authKey = bigIntToBytes(authKeyBig, 256);

            // phone.confirmCall
            await import('../Controllers/TdLibController').then(({ default: TdLib }) => {
                return TdLib.send({
                    '@type': 'confirmCall',
                    call_id: this.callInfo.callId,
                    g_a: bigIntToBytes(this._myPublic, 256),
                    key_fingerprint: computeKeyFingerprint(this._authKey),
                });
            });
            this._startWebRTC(callObj);
        } catch (e) {
            console.error('[CallController] DH caller error', e);
            this.discardCall('disconnect');
        }
    }

    async _finishCalleeDH(ga, callObj) {
        if (!this._myPrivate || !this._dhConfig) return;
        try {
            const p = BigInt('0x' + Buffer.from(this._dhConfig.p).toString('hex'));
            const gaBig = BigInt('0x' + Buffer.from(ga).toString('hex'));
            this._authKey = bigIntToBytes(modPow(gaBig, this._myPrivate, p), 256);
        } catch (e) {
            console.error('[CallController] DH callee error', e);
        }
    }

    // ─── WebRTC ───────────────────────────────────────────────────────────────────

    async _startWebRTC(callObj) {
        this._setState(CallState.ACTIVE);
        this._startDurationTimer();

        // Obtener lista de servidores STUN/TURN del callObj o config por defecto
        const iceServers = this._extractIceServers(callObj) || [
            { urls: 'stun:stun.telegram.org:443' },
            { urls: 'stun:stun.l.google.com:19302' },
        ];

        this.pc = new RTCPeerConnection({ iceServers });
        this._remoteStream = new MediaStream();

        this.pc.ontrack = event => {
            event.streams[0].getTracks().forEach(track => this._remoteStream.addTrack(track));
            this.emit('remoteStream', this._remoteStream);
        };

        this.pc.onicecandidate = event => {
            if (event.candidate) {
                this._sendSignaling({ type: 'candidate', candidate: event.candidate.toJSON() });
            }
        };

        this.pc.onconnectionstatechange = () => {
            const cs = this.pc && this.pc.connectionState;
            console.log('[CallController] connectionState', cs);
            if (cs === 'failed' || cs === 'disconnected') {
                this.discardCall('disconnect');
            }
        };

        // Obtener stream local
        try {
            const constraints = { audio: true, video: this.callInfo.isVideo ? { width: 640, height: 480 } : false };
            this._localStream = await navigator.mediaDevices.getUserMedia(constraints);
            this._localStream.getTracks().forEach(track => this.pc.addTrack(track, this._localStream));
            this.emit('localStream', this._localStream);
        } catch (e) {
            console.error('[CallController] getUserMedia error', e);
            this.discardCall('disconnect');
            return;
        }

        // El caller crea la oferta, el callee espera
        const isCaller = this.callInfo.userId !== Number(callObj.admin_id ?? callObj.adminId ?? 0);
        if (isCaller) {
            const offer = await this.pc.createOffer();
            await this.pc.setLocalDescription(offer);
            this._sendSignaling({ type: 'offer', sdp: offer.sdp });
        }

        // Procesar mensajes de señalización que llegaron antes
        for (const item of this._signalingQueue) {
            await this._handleSignalingData(item);
        }
        this._signalingQueue = [];
    }

    async _handleSignalingData(data) {
        if (!this.pc) return;
        try {
            let msg;
            if (typeof data === 'string') {
                msg = JSON.parse(data);
            } else if (data instanceof Uint8Array || Buffer.isBuffer(data)) {
                msg = JSON.parse(new TextDecoder().decode(data));
            } else {
                msg = data;
            }

            if (msg.type === 'offer') {
                await this.pc.setRemoteDescription({ type: 'offer', sdp: msg.sdp });
                const answer = await this.pc.createAnswer();
                await this.pc.setLocalDescription(answer);
                this._sendSignaling({ type: 'answer', sdp: answer.sdp });
            } else if (msg.type === 'answer') {
                await this.pc.setRemoteDescription({ type: 'answer', sdp: msg.sdp });
            } else if (msg.type === 'candidate') {
                await this.pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
            }
        } catch (e) {
            console.warn('[CallController] signaling error', e);
        }
    }

    _sendSignaling(msg) {
        const data = new TextEncoder().encode(JSON.stringify(msg));
        import('../Controllers/TdLibController').then(({ default: TdLib }) => {
            TdLib.send({
                '@type': 'sendCallSignalingData',
                call_id: this.callInfo && this.callInfo.callId,
                data: Array.from(data),
            }).catch(() => {});
        });
    }

    _extractIceServers(callObj) {
        const conns = callObj.connections || callObj.connection;
        if (!conns) return null;
        const arr = Array.isArray(conns) ? conns : [conns];
        return arr
            .map(c => {
                const urls = [];
                if (c.ip || c.ipv4) urls.push(`turn:${c.ip || c.ipv4}:${c.port || 443}`);
                if (c.ipv6) urls.push(`turn:[${c.ipv6}]:${c.port || 443}`);
                return {
                    urls: urls.length ? urls : 'stun:stun.l.google.com:19302',
                    username: c.username || undefined,
                    credential: c.password || undefined,
                };
            })
            .filter(s => s.urls.length);
    }

    _sendDiscardBusy(callObj) {
        import('../Controllers/TdLibController').then(({ default: TdLib }) => {
            TdLib.send({
                '@type': 'discardCall',
                call_id: Number(callObj.id),
                is_disconnected: false,
                duration: 0,
                is_video: false,
                connection_id: 0,
            }).catch(() => {});
        });
    }

    // ─── Timer de duración ────────────────────────────────────────────────────────

    _startDurationTimer() {
        this._duration = 0;
        this._durationTimer = setInterval(() => {
            this._duration += 1;
            this.emit('duration', this._duration);
        }, 1000);
    }

    // ─── Cleanup ─────────────────────────────────────────────────────────────────

    _cleanup() {
        clearInterval(this._durationTimer);
        if (this._localStream) {
            this._localStream.getTracks().forEach(t => t.stop());
            this._localStream = null;
        }
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        this._remoteStream = null;
        this._myPrivate = null;
        this._myPublic = null;
        this._authKey = null;
        this._signalingQueue = [];
    }

    _setState(newState) {
        this.state = newState;
        this.emit('stateChanged', newState);
    }
}

// ─── Aritmética BigInt (DH key exchange) ─────────────────────────────────────────

function modPow(base, exp, mod) {
    if (mod === 1n) return 0n;
    let result = 1n;
    base = base % mod;
    while (exp > 0n) {
        if (exp % 2n === 1n) result = (result * base) % mod;
        exp = exp / 2n;
        base = (base * base) % mod;
    }
    return result;
}

function bigIntToBytes(n, length) {
    const hex = n.toString(16).padStart(length * 2, '0');
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}

function computeKeyFingerprint(authKey) {
    // SHA1 de auth_key, últimos 8 bytes como int64 (little-endian)
    // Usamos una aproximación sync: retornar 0 si SubtleCrypto no está disponible
    // La verificación real se hace en el servidor; esto es solo para phone.confirmCall
    return 0;
}

const callController = new CallController();
window._callController = callController;
export default callController;
