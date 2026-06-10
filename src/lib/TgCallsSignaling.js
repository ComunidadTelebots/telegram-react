/* global BigInt */
/**
 * TgCallsSignaling — protocolo de señalización P2P compatible con clientes oficiales de Telegram.
 *
 * Los clientes oficiales (Android, iOS, Desktop) usan tgcalls que intercambia mensajes JSON:
 *   InitialSetup → credenciales ICE + fingerprints DTLS
 *   NegotiateChannels → descripción de medios (codecs, SSRCs, RTP extensions)
 *   Candidates → candidatos ICE
 *   MediaState → estado de mute/video
 *
 * Los mensajes se encriptan con AES-CTR usando la auth_key del DH exchange,
 * mismo esquema que MTProto2 pero para datos de señalización (capa P2P).
 *
 * Referencia: telegram-tt (Ajaxy/telegram-tt) src/lib/vibecalls/phone/
 */

import pako from 'pako';

// ─── Crypto helpers ────────────────────────────────────────────────────────────

async function sha256(data) {
    const buf = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(buf);
}

function concat(...arrays) {
    const total = arrays.reduce((s, a) => s + a.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const a of arrays) {
        result.set(a, offset);
        offset += a.length;
    }
    return result;
}

async function calcAesKey(authKey, msgKey, isOutgoing) {
    const x = isOutgoing ? 0 : 8;
    const sha256a = await sha256(concat(msgKey, authKey.slice(x, x + 36)));
    const sha256b = await sha256(concat(authKey.slice(40 + x, 40 + x + 36), msgKey));
    const key = concat(sha256a.slice(0, 8), sha256b.slice(8, 24), sha256a.slice(24, 32));
    const iv = concat(sha256b.slice(0, 4), sha256a.slice(8, 16), sha256b.slice(24, 28));
    return { key, iv };
}

async function aesCtrEncrypt(data, key, iv) {
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-CTR' }, false, ['encrypt']);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-CTR', counter: iv, length: 64 }, cryptoKey, data);
    return new Uint8Array(encrypted);
}

async function aesCtrDecrypt(data, key, iv) {
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-CTR' }, false, ['decrypt']);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-CTR', counter: iv, length: 64 }, cryptoKey, data);
    return new Uint8Array(decrypted);
}

// ─── Encode / Decode ──────────────────────────────────────────────────────────

export async function encodeSignalingMessage(message, authKey, seq, isOutgoing) {
    const jsonBytes = new TextEncoder().encode(JSON.stringify(message));
    const compressed = pako.gzip(jsonBytes);

    // packet = seq(4 bytes big-endian) + compressed data
    const packet = new Uint8Array(4 + compressed.length);
    new DataView(packet.buffer).setUint32(0, seq, false); // big-endian
    packet.set(compressed, 4);

    // msgKeyLarge = SHA256(authKey[88+x : 88+x+36] + packet)
    // x=0 para el iniciador (outgoing), x=8 para el receptor (incoming) — sin offset 128
    const x = isOutgoing ? 0 : 8;
    const msgKeyInput = concat(authKey.slice(88 + x, 88 + x + 36), packet);
    const msgKeyLarge = await sha256(msgKeyInput);
    const msgKey = msgKeyLarge.slice(8, 24); // 16 bytes

    const { key, iv } = await calcAesKey(authKey, msgKey, isOutgoing);
    const encrypted = await aesCtrEncrypt(packet, key, iv);

    return Array.from(concat(msgKey, encrypted));
}

export async function decodeSignalingMessage(data, authKey, isOutgoing) {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (bytes.length < 16) return null;

    const msgKey = bytes.slice(0, 16);
    const encrypted = bytes.slice(16);

    const { key, iv } = await calcAesKey(authKey, msgKey, !isOutgoing); // invertir para decodificar
    const packet = await aesCtrDecrypt(encrypted, key, iv);

    // packet = seq(4) + compressed
    const compressed = packet.slice(4);
    try {
        const jsonBytes = pako.ungzip(compressed);
        const json = new TextDecoder().decode(jsonBytes);
        return JSON.parse(json);
    } catch (e) {
        // Puede no estar comprimido en algunos clientes
        try {
            const json = new TextDecoder().decode(compressed);
            return JSON.parse(json);
        } catch {
            return null;
        }
    }
}

// ─── SDP parsing ──────────────────────────────────────────────────────────────

export function parseInitialSetup(sdp) {
    const lines = sdp.split('\n').map(l => l.trim());
    const ufrag = (lines.find(l => l.startsWith('a=ice-ufrag:')) || '').replace('a=ice-ufrag:', '');
    const pwd = (lines.find(l => l.startsWith('a=ice-pwd:')) || '').replace('a=ice-pwd:', '');
    const renomination = lines.some(l => l.includes('renomination'));

    const fingerprints = lines
        .filter(l => l.startsWith('a=fingerprint:'))
        .map(l => {
            const parts = l.replace('a=fingerprint:', '').split(' ');
            return { hash: parts[0], fingerprint: parts[1] };
        });

    return { '@type': 'InitialSetup', ufrag, pwd, renomination, fingerprints };
}

export function parseMediaContents(sdp) {
    const lines = sdp.split('\n').map(l => l.trim());
    const contents = [];
    let currentMedia = null;

    for (const line of lines) {
        if (line.startsWith('m=')) {
            if (currentMedia) contents.push(currentMedia);
            const parts = line.split(' ');
            const type = parts[0].replace('m=', '');
            if (type === 'audio' || type === 'video') {
                currentMedia = {
                    type,
                    ssrc: null,
                    ssrcGroups: [],
                    payloadTypes: [],
                    rtpExtensions: [],
                    _rtpmap: {},
                    _fmtp: {},
                    _rtcpfb: {},
                };
            } else {
                currentMedia = null;
            }
            continue;
        }
        if (!currentMedia) continue;

        if (
            line.startsWith('a=ssrc:') &&
            !line.includes('msid') &&
            !line.includes('mslabel') &&
            !line.includes('label') &&
            !line.includes('cname')
        ) {
            // already handled
        }
        if (line.startsWith('a=ssrc:') && line.includes('cname')) {
            const ssrc = line.split(':')[1].split(' ')[0];
            if (!currentMedia.ssrc) currentMedia.ssrc = ssrc;
        }
        if (line.startsWith('a=ssrc-group:')) {
            const parts = line.replace('a=ssrc-group:', '').split(' ');
            const semantics = parts[0];
            const ssrcs = parts.slice(1);
            currentMedia.ssrcGroups.push({ semantics, ssrcs });
        }
        if (line.startsWith('a=rtpmap:')) {
            const rest = line.replace('a=rtpmap:', '');
            const [pt, codecStr] = rest.split(' ');
            const codecParts = codecStr.split('/');
            currentMedia._rtpmap[pt] = { name: codecParts[0], clockRate: codecParts[1], channels: codecParts[2] };
        }
        if (line.startsWith('a=fmtp:')) {
            const rest = line.replace('a=fmtp:', '');
            const spaceIdx = rest.indexOf(' ');
            const pt = rest.slice(0, spaceIdx);
            const params = rest.slice(spaceIdx + 1);
            currentMedia._fmtp[pt] = params;
        }
        if (line.startsWith('a=rtcp-fb:')) {
            const rest = line.replace('a=rtcp-fb:', '');
            const parts = rest.split(' ');
            const pt = parts[0];
            if (!currentMedia._rtcpfb[pt]) currentMedia._rtcpfb[pt] = [];
            currentMedia._rtcpfb[pt].push(parts.slice(1).join(' '));
        }
        if (line.startsWith('a=extmap:')) {
            const rest = line.replace('a=extmap:', '');
            const parts = rest.split(' ');
            const id = parts[0].split('/')[0];
            const uri = parts[1];
            currentMedia.rtpExtensions.push({ id, uri });
        }
    }
    if (currentMedia) contents.push(currentMedia);

    // Construir payloadTypes completos
    return contents.map(c => {
        const payloadTypes = Object.entries(c._rtpmap).map(([pt, codec]) => {
            const feedbackTypes = (c._rtcpfb[pt] || []).map(fb => {
                const parts = fb.split(' ');
                return { type: parts[0], subtype: parts[1] || '' };
            });
            const parameters = {};
            if (c._fmtp[pt]) {
                c._fmtp[pt].split(';').forEach(p => {
                    const [k, v] = p.trim().split('=');
                    if (k) parameters[k] = v || '';
                });
            }
            return {
                id: parseInt(pt),
                name: codec.name,
                clockrate: parseInt(codec.clockRate),
                channels: codec.channels ? parseInt(codec.channels) : undefined,
                feedbackTypes,
                parameters,
            };
        });
        return {
            type: c.type,
            ssrc: c.ssrc || '0',
            ssrcGroups: c.ssrcGroups,
            payloadTypes,
            rtpExtensions: c.rtpExtensions,
        };
    });
}

// ─── Build remote SDP from tgcalls messages ────────────────────────────────────

export function buildRemoteSdp(setup, channels, candidates, isOutgoing) {
    const dtlsRole = isOutgoing ? 'active' : 'passive';
    const iceOptions = setup.renomination ? '\r\na=ice-options:renomination' : '';

    let sdp = `v=0\r\no=- 0 2 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=group:BUNDLE`;

    const mids = channels.contents.map((_, i) => i.toString());
    sdp += ' ' + mids.join(' ') + '\r\n';
    sdp += 'a=msid-semantic: WMS\r\n';

    for (let i = 0; i < channels.contents.length; i++) {
        const content = channels.contents[i];
        const mid = i.toString();
        const ptIds = content.payloadTypes.map(p => p.id).join(' ');

        sdp += `m=${content.type} 1 UDP/TLS/RTP/SAVPF ${ptIds}\r\n`;
        sdp += `c=IN IP4 0.0.0.0\r\n`;
        sdp += `a=ice-ufrag:${setup.ufrag}\r\n`;
        sdp += `a=ice-pwd:${setup.pwd}\r\n`;
        if (iceOptions) sdp += `a=ice-options:renomination\r\n`;

        for (const fp of setup.fingerprints) {
            sdp += `a=fingerprint:${fp.hash} ${fp.fingerprint}\r\n`;
        }

        sdp += `a=setup:${dtlsRole}\r\n`;
        sdp += `a=mid:${mid}\r\n`;

        for (const ext of content.rtpExtensions || []) {
            sdp += `a=extmap:${ext.id} ${ext.uri}\r\n`;
        }

        sdp += `a=sendrecv\r\n`;
        sdp += `a=rtcp-mux\r\n`;

        for (const pt of content.payloadTypes) {
            let codecLine = `${pt.id} ${pt.name}/${pt.clockrate}`;
            if (pt.channels && pt.channels > 1) codecLine += `/${pt.channels}`;
            sdp += `a=rtpmap:${codecLine}\r\n`;

            const params = pt.parameters
                ? Object.entries(pt.parameters)
                      .map(([k, v]) => (v ? `${k}=${v}` : k))
                      .join(';')
                : '';
            if (params) sdp += `a=fmtp:${pt.id} ${params}\r\n`;

            for (const fb of pt.feedbackTypes || []) {
                const fbStr = fb.subtype ? `${fb.type} ${fb.subtype}` : fb.type;
                sdp += `a=rtcp-fb:${pt.id} ${fbStr}\r\n`;
            }
        }

        if (content.ssrc && content.ssrc !== '0') {
            sdp += `a=ssrc:${content.ssrc} cname:stream\r\n`;
        }
        for (const g of content.ssrcGroups || []) {
            sdp += `a=ssrc-group:${g.semantics} ${g.ssrcs.join(' ')}\r\n`;
        }

        if (candidates) {
            for (const c of candidates) {
                sdp += `a=candidate:${c.sdpString}\r\n`;
            }
            sdp += `a=end-of-candidates\r\n`;
        }
    }

    return sdp;
}
