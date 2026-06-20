# Changelog

## [0.0.624] - 2026-06-20 — W3 Calls: Rating dialog + setCallRating
### Added
- **W3 Call rating** — `CallRatingDialog` (estrellas 1-5) se abre automáticamente al finalizar llamada
  - Estado `CallState.ENDED` dispara el dialog con el `call_id` guardado
  - Rating < 4: muestra campo de comentario opcional
  - Botón "Enviar" llama `setCallRating` → `phone.SetCallRating` en GramJsController
  - Botón "Omitir" cierra sin enviar
  - Montado en `MainPage.js` junto a `IncomingCall` / `ActiveCall`

## [0.0.623] - 2026-06-20 — W2 Calls: Tono de llamada (Web Audio API)
### Added
- **W2 Call tone** — `src/lib/CallTone.js` usando Web Audio API puro (sin archivos de audio)
  - `startRingTone('ring')`: tono de llamada entrante (440+480 Hz, 1s ON / 3s OFF)
  - `startRingTone('ringback')`: tono de espera saliente (440 Hz, 1s ON / 2s OFF)
  - `stopTone()`: corta el tono en todos los estados (accepted, discarded, active, idle)
  - Integrado en CallController: ring al recibir llamada, ringback al iniciar, stop al aceptar/rechazar/activo

## [0.0.622] - 2026-06-20 — W1 Calls: Fix doble dispatch + ICE servers
### Fixed
- **W1 Call bugs**: eliminado bloque de despacho directo que causaba que `UpdatePhoneCall` se procesara dos veces
  - Segunda vuelta: estado ya era `INCOMING` → `_sendDiscardBusy()` se llamaba automáticamente → llamada descartada antes de mostrarse
  - Eliminado `ReceivedCall` duplicado en `_acceptCall` (ya lo envía `_onCallRequested`)
  - `_extractIceServers` ahora distingue `PhoneConnectionWebrtc` (TURN/STUN) de `PhoneConnection` (legacy UDP relay no usable en WebRTC estándar); fallback a Google STUN

## [0.0.621] - 2026-06-20 — B2 Admin Management Panel
### Added
- **B2 Admin Management** — Panel de gestión de admins en ChatDetails (grupos/canales supergrupo)
  - Nuevo item "Administradores" en la sección de acciones del chat
  - `AdminManagement` panel lateral: lista todos los admins via `getChannelAdmins` (channels.GetParticipants con ChannelParticipantsAdmins)
  - Click "Editar" abre subvista con toggles de 10 permisos individuales + campo de título
  - Click "Quitar" revoca los privilegios admin vía `editAdmin` (rights vacíos)
  - Botón Guardar aplica cambios via `editAdmin` con los rights seleccionados y rank
  - CSS panel lateral derecho con `var(--)`, adaptado a todos los temas
  - `_getChannelAdmins` nuevo método en GramJsController

## [0.0.620] - 2026-06-20 — J1 Sponsored Messages UI
### Added
- **J1 Sponsored Messages** — Inyección en MessagesList para canales
  - Carga `getSponsoredMessages` al abrir un canal (por chat_id)
  - Mensajes patrocinados aparecen al final de la lista con etiqueta "Patrocinado" en azul
  - `IntersectionObserver` (threshold 0.5) llama `viewSponsoredMessage` cuando el mensaje se hace visible
  - Se limpian al cambiar de chat (no-canal resetea a `[]`)
  - CSS con `var(--)` adaptado a todos los temas

## [0.0.619] - 2026-06-20 — E2 Emoji Groups en EmojiPickerButton
### Added
- **E2 Emoji Groups** — Barra de grupos de emoji encima del picker (solo tab emoji)
  - Carga `getEmojiGroups` en `componentDidMount`
  - Scroll horizontal de botones-emoji (primer emoticon de cada grupo como icono)
  - Click en grupo inserta ese emoji directamente vía `onSelect`
  - Tooltip con el título del grupo; CSS con `var(--)` adaptado a todos los temas

## [0.0.618] - 2026-06-20 — F1 Attach Menu Bots UI
### Added
- **F1 Attach Menu Bots** — AttachButton carga `getAttachMenuBots` en `componentDidMount`
  - Bots del menú adjuntar aparecen como items adicionales en el menú paperclip
  - Click en un bot llama `requestSimpleWebView` y abre la URL en nueva pestaña
  - No modifica bots existentes; solo agrega dinámicamente los del servidor

## [0.0.617] - 2026-06-20 — J3 Live Location UI
### Added
- **J3 Live Location UI** — Botón "Ubicación en vivo" en el menú adjuntar (paperclip)
  - Obtiene la geolocalización del navegador y llama `sendLiveLocation` (GramJS)
  - Nuevo `LiveLocationPanel` anclado en InputBoxControl: cuenta regresiva MM:SS, punto verde animado, botón "Detener"
  - Ciclo `setInterval` de 30s actualizando la posición con `editLiveLocation` (nuevo método GramJS)
  - Botón "Detener" manda `editLiveLocation({stopped:true})` y cancela el ciclo
  - `_editLiveLocation` en GramJsController usa `messages.EditMessage` con `InputMediaGeoLive({stopped})`
  - CSS con `var(--)`, adaptado a todos los temas



## [0.0.616] - 2026-06-20 — Sprint autónomo: features completas
### Added (todos los CSS usan `var(--)`, adaptados a 46 clases design-*)

**A — Privacidad y Datos**
- `[0.0.606]` **A1 Privacy Panel** — `account.GetPrivacy/SetPrivacy` para 9 keys (StatusTimestamp, PhoneNumber, ProfilePhoto, PhoneCall, Forwards, ChatInvite, VoiceMessages, About, Birthday). Panel en Settings: Everyone/Contacts/Nobody.
- `[0.0.607]` **A2 Global Privacy** — `account.GetGlobalPrivacySettings/SetGlobalPrivacySettings`. Toggles: archive+mute, keep unarchived, hide read marks, require premium.
- `[0.0.608]` **A3-A5 Account & Data** — `GetAccountTTL/SetAccountTTL` (30/90/180/365 días), `GetContentSettings/SetContentSettings` (contenido sensible), `GetAutoDownloadSettings/SaveAutoDownloadSettings`.

**B — Admin Canales/Grupos**
- `[0.0.609]` **B1-B4** — `channels.GetAdminLog` + panel Recent Actions en ChatDetails; `channels.EditAdmin` (rangos/permisos/rank); `messages.GetChatInviteImporters(requested)+HideChatJoinRequest` panel Join Requests aprobar/rechazar; `channels.ToggleJoinToSend/ToggleJoinRequest`.

**E — Stickers/Emoji**
- `[0.0.610]` **E1-E3** — `messages.GetFavedStickers+FaveSticker` (panel FavedStickers con quitar); `messages.GetEmojiGroups` (categorías disponibles vía dispatch); `messages.GetStickerSet(InputStickerSetAnimatedEmoji)`.

**D — Business**
- `[0.0.611]` **D1-D5** — `account.UpdateBusinessGreetingMessage/AwayMessage/WorkHours/Location/Intro`. BusinessEditor en BusinessInfo: editar intro y ubicación.

**F — Mini Apps / Bots**
- `[0.0.612]` **F1-F2** — `messages.GetAttachMenuBots`; `messages.GetBotApp + RequestAppWebView + RequestSimpleWebView`.

**C — Stats / Monetización**
- `[0.0.613]` **C1-C4** — `stats.GetMessageStats/GetMegagroupStats/GetMessagePublicForwards`; `stats.GetBroadcastRevenueStats + payments.GetStarsRevenueStats`. Panel ChannelStats en ChatDetails (TON + Stars revenue).

**G — Stories**
- `[0.0.614]` **G1-G2** — `stories.SendReaction` (emoji/paid/empty); `stories.TogglePinned + GetPinnedStories`.

**H — Stars**
- `[0.0.615]` **H1-H2** — `payments.GetStarsTopupOptions`; `payments.GetPaymentForm + SendPaymentForm` (credentials stars para paid media).

**J — Sueltos**
- `[0.0.616]` **J1-J4** — `messages.GetSponsoredMessages + ViewSponsoredMessage`; `chatlists.ExportChatlistInvite`; `sendLiveLocation` vía `InputMediaGeoLive`; `messages.GetSearchCounters` (photo/video/doc/url/audio/voice/gif).

**I — Llamadas de grupo**: documentado en `TODO_PENDIENTE.md` (bloqueado por WebRTC).

---

## [0.0.603] - 2026-06-20
### Added
- **Enviar con Efecto** (Send with Effect) — paridad con Telegram Android/iOS
  - Botón ✨ junto al botón Enviar; aparece solo si el servidor devuelve efectos disponibles
  - Llama `getAvailableMessageEffects` al montar el componente
  - Picker emergente con grid de efectos seleccionables; el efecto activo queda resaltado
  - Pasa `effect_id` en `sendMessage`; se limpia automáticamente tras enviar
  - El indicador `✨` ya existente en `Message.js` muestra los efectos recibidos
  - CSS con skin adaptado: `.effect-picker-popup` usa variables de tema

- **Gestión de Carpetas de Chat** (Chat Folder Management) — paridad con Telegram Android
  - Las pestañas de carpetas ahora se muestran **siempre** (incluso con 0 carpetas) con tab "Todos"
  - Botón `+` al final de los tabs para crear una carpeta nueva
  - Diálogo `createChatFilter` con campo de nombre (máx. 12 caracteres, Enter para confirmar)
  - Botón `×` visible al hacer hover sobre cada tab para eliminar la carpeta (`deleteChatFilter`)
  - Iconos emoji por `icon_name` del filtro (Personal 👤, Work 💼, Bots 🤖, etc.)
  - Ayudante `getFolderIcon()` con tabla de iconos predefinidos
  - CSS nuevos: `.folder-tab-add`, `.folder-tab-delete`, `.folder-tab-icon`

### Build
- `npm run build` pasa sin errores ni warnings

## [0.0.602] - 2026-06-17
### Verified
- Inline bot results functionality fully implemented and working
  - `_getInlineBotResults()` in GramJsController resolves bot by username and fetches inline results
  - `detectInlineBot()` in InputBoxControl detects `@username query` pattern with 300ms debounce
  - `InlineBotResults` component renders results in list or grid layout
  - `handleInlineBotSelect()` sends selected result via `sendInlineBotResult`
  - Complete flow: GramJsController → InputBoxControl → InlineBotResults

- Build passes clean, no errors
- Normal input flow verified: text messages, commands (/), mentions (@user) all working
- Panel positioned correctly with proper styling and animations

## [0.0.601] - Previous
- Earlier versions

