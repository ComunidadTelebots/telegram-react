# TODO_PENDIENTE.md
## Features no implementadas por bloqueo técnico

### I. Llamadas de grupo/vídeo (getGroupCall / joinGroupCall)
**Estado:** BLOQUEADO — requiere WebRTC completo  
**Razón:**
- `phone.GetGroupCall` y `phone.JoinGroupCall` existen en la API de Telegram (GramJS tiene las clases).
- Unirse a una llamada de grupo requiere establecer una sesión WebRTC P2P: generación de SDP offer/answer, ICE candidates, TURN/STUN servers, gestión de tracks de audio/vídeo.
- Este cliente ya tiene la capa VoIP 1:1 completa (`requestCall`/`acceptCall`/`discardCall` + DH E2E + AES-CTR signaling), pero NO tiene la capa WebRTC de grupo (diferente protocolo).
- Telegram Group Calls requiere `JoinGroupCall` con SDP + gestionar múltiples streams multimedia simultáneos.

**Lo que se necesitaría:**
1. `phone.GetGroupCall` → obtener info del call activo en el chat
2. `phone.JoinGroupCall` → unirse con SDP offer → recibir SDP answer
3. WebRTC: crear PeerConnection, añadir tracks, intercambiar ICE candidates vía `phone.SaveCallDebug`
4. UI: panel de llamada grupal (participantes, mute, vídeo, levantar la mano, etc.)

**Estimado:** 3-5 días de trabajo dedicado.

---

## Estado del sprint — completado

Todas las features del sprint autónomo están implementadas:

| Feature | Versión | Estado |
|---------|---------|--------|
| A1-A5 Privacidad y datos | 0.0.606–0.0.608 | ✅ |
| B1-B4 Admin canales/grupos | 0.0.609 | ✅ |
| B2 Admin Management UI | 0.0.621 | ✅ |
| C1-C4 Stats / Monetización | 0.0.613 | ✅ |
| D1-D5 Business | 0.0.611 | ✅ |
| E1-E3 Stickers/Emoji | 0.0.610 | ✅ |
| E2 Emoji Groups picker | 0.0.619 | ✅ |
| F1-F2 Mini Apps / Bots | 0.0.612 | ✅ |
| F1 Attach Menu Bots UI | 0.0.618 | ✅ |
| G1-G2 Stories | 0.0.614 | ✅ |
| H1-H2 Stars | 0.0.615 | ✅ |
| J1-J4 Sueltos | 0.0.616 | ✅ |
| J1 Sponsored Messages UI | 0.0.620 | ✅ |
| J3 Live Location UI | 0.0.617 | ✅ |
| W1 Calls: Fix doble dispatch + ICE | 0.0.622 | ✅ |
| W2 Calls: Ring tones (Web Audio) | 0.0.623 | ✅ |
| W3 Calls: Rating dialog | 0.0.624 | ✅ |
| W4 Calls: Conectando... + CSS overrides | 0.0.625 | ✅ |
| **I. Llamadas de grupo** | — | ❌ BLOQUEADO |
