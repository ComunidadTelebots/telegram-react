/**
 * CallTone — genera tonos de llamada sintéticos con Web Audio API.
 * ring: tono de llamada entrante (1s ON / 3s OFF, DTMF 440+480 Hz)
 * ringback: tono de espera de respuesta saliente (1s ON / 2s OFF, 440 Hz)
 */

let ctx = null;

function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
}

let _stopFn = null;

export function startRingTone(type = 'ring') {
    stopTone();
    const ac = getCtx();
    let stopped = false;

    const play = () => {
        if (stopped) return;
        const now = ac.currentTime;

        if (type === 'ring') {
            // Two-frequency ring (like European ring tone)
            const freqs = [440, 480];
            const gains = freqs.map(() => {
                const g = ac.createGain();
                g.connect(ac.destination);
                g.gain.setValueAtTime(0, now);
                g.gain.linearRampToValueAtTime(0.15, now + 0.05);
                g.gain.setValueAtTime(0.15, now + 1.0);
                g.gain.linearRampToValueAtTime(0, now + 1.1);
                return g;
            });
            freqs.forEach((freq, i) => {
                const osc = ac.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;
                osc.connect(gains[i]);
                osc.start(now);
                osc.stop(now + 1.2);
            });
            // Repeat after 3s (1s ring + 2s silence)
            const timer = setTimeout(() => {
                if (!stopped) play();
            }, 3000);
            _stopFn = () => {
                stopped = true;
                clearTimeout(timer);
            };
        } else {
            // Ringback tone (outgoing — waiting for answer)
            const g = ac.createGain();
            g.connect(ac.destination);
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.1, now + 0.05);
            g.gain.setValueAtTime(0.1, now + 1.0);
            g.gain.linearRampToValueAtTime(0, now + 1.05);
            const osc = ac.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = 440;
            osc.connect(g);
            osc.start(now);
            osc.stop(now + 1.1);
            // Repeat after 3s (1s ring + 2s silence)
            const timer = setTimeout(() => {
                if (!stopped) play();
            }, 3000);
            _stopFn = () => {
                stopped = true;
                clearTimeout(timer);
            };
        }
    };

    play();
}

export function stopTone() {
    if (_stopFn) {
        _stopFn();
        _stopFn = null;
    }
}
