# TODO_PENDIENTE.md
## Features no implementadas por bloqueo técnico

### I. Llamadas de grupo/vídeo (getGroupCall / joinGroupCall)
**Estado:** BLOQUEADO — requiere WebRTC completo  
**Razón:**
- `phone.GetGroupCall` y `phone.JoinGroupCall` existen en la API de Telegram (GramJS tiene las clases).
- Unirse a una llamada de grupo requiere establecer una sesión WebRTC P2P: generación de SDP offer/answer, ICE candidates, TURN/STUN servers, gestión de tracks de audio/vídeo.
- Este cliente ya tiene una capa VoIP 1:1 (`requestCall`/`acceptCall`/`discardCall`) pero NO tiene la capa WebRTC de grupo (diferente protocolo, usa `GroupCall` en Telegram que requiere `JoinGroupCall` con un SDP y luego gestionar el stream multimedia).
- Implementar correctamente requeriría integrar librerías como `mediasoup-client` o adaptar la WebRTC nativa del navegador con el protocolo de Telegram Group Calls, que es sustancialmente más complejo que llamadas 1:1.

**Lo que se necesitaría:**
1. `phone.GetGroupCall` → obtener info del call activo en el chat
2. `phone.JoinGroupCall` → unirse con SDP offer → recibir SDP answer
3. WebRTC: crear PeerConnection, añadir tracks, intercambiar ICE candidates vía `phone.SaveCallDebug`
4. UI: panel de llamada grupal (participantes, mute, vídeo, levantar la mano, etc.)

**Estimado:** 3-5 días de trabajo dedicado, fuera del alcance de este sprint autónomo.

---

### Mejoras futuras identificadas durante el sprint

- **E2 GetEmojiGroups en picker**: Las categorías de emoji se obtienen pero no se renderizan en el picker existente (EmojiControl). Integrar las categorías dinámicas requeriría refactorizar EmojiControl.
- **J1 SponsoredMessages UI**: Los mensajes patrocinados se obtienen pero no se renderizan en el chat. Requeriría inyectarlos en la lista de mensajes con scroll infinito.
- **J3 Live Location stop/update**: La ubicación en vivo se envía pero el ciclo de actualización periódica (`editMessage` cada 5min) y el botón de parada no están implementados como UI; el método GramJS está disponible.
- **B2 EditAdmin UI**: El método `editAdmin` está disponible en GramJS pero no hay UI para gestionar roles de admins (añadir/quitar/editar permisos individuales).
- **F1 AttachMenuBots UI**: Los bots del menú adjuntar se obtienen pero no se muestran en el botón de adjuntar (paperclip menu).
