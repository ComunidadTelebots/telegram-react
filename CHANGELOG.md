# Changelog

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

