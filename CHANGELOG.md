# Changelog

## [0.0.545] - 2026-06-17
### Añadido
- **Story Publishing**: botón "Mi historia" (+) en StoriesTray. StoryComposer.js: modal con selector de foto/vídeo, caption, privacy (Todos/Contactos/Amigos cercanos), duración (6h/12h/24h/48h). GramJsController `_sendStory` sube el archivo con `uploadFile` y llama `stories.SendStory` con `InputPrivacyValueAllowAll/Contacts/CloseFriends`. Skin overrides en StoryComposer.css para 10 diseños.

## [0.0.544] - 2026-06-17
### Añadido
- **Stories completas**: vista de stories de contactos con tray + viewer full-screen.
  - Tray horizontal sticky en la lista de chats con anillo accent (unread gradient, read gris).
  - Viewer con barra de progreso segmentada, auto-avanzar, tap-nav (izq/der), ArrowKey nav.
  - Swipe down → cerrar; swipe up → abrir campo de respuesta a la story.
  - Marcado automático como leídas al visualizar (`readStories`).
  - Lista de viewers en stories propias (botón 👁 en header → panel deslizable).
  - `getStoryViewers` en GramJsController usando `Api.stories.GetStoryViewsList`.
  - Skin overrides del anillo para todos los 12 diseños. Safe-area en móvil.

## [0.0.543] - 2026-06-17
### Añadido
- **Paid Reactions**: detecta `ReactionPaid` en `translateReactions` y propaga `paid_total_count`. Reactions.js muestra badge ⭐ + total de estrellas si `paid_total_count > 0`. CSS con fondo amarillo semitransparente. Sin envío, solo render.

## [0.0.542] - 2026-06-17
### Añadido
- **Profile Colors**: propaga `accent_color_id` (0-6) desde GramJS `user.color` en EntityTranslator. En Header.js, el chat header de chats privados muestra un borde inferior de 2px con el color de acento del peer (paleta de 7 colores Telegram). Sin editor, solo render.

## [0.0.541] - 2026-06-17
### Añadido
- **Message Effects**: propaga `effect_id` desde GramJS (`msg.effect`) en EntityTranslator. Si el mensaje tiene efecto, muestra indicador ✨ con animación CSS `effect-sparkle` (pulse + rotate). Sin selector de efectos, solo render.

## [0.0.540] - 2026-06-17
### Añadido
- **Custom Emoji**: caché compartida a nivel de módulo (`stickerCache`) en CustomEmoji.js para evitar llamadas duplicadas a `getCustomEmojiDocuments` por el mismo emoji ID. Render ya existente: Lottie animado, video webm, imagen estática; IntersectionObserver para lazy load; fallback a texto plano.

## [0.0.539] - 2026-06-17
### Añadido
- **Voice Transcription CSS polish**: skin overrides para los 12 diseños en `.voice-speed-active` y `.voice-transcription-rate-btn`. Variable `--message-error-color` para el color de error. Variable `--accent` añadida al fallback chain de `.voice-speed-active`.

## [0.0.538] - 2026-06-17
### Añadido
- **Quote Reply**: lee `reply_to.quote.text` de mensajes entrantes y muestra la cita con `<mark>` resaltado en el componente Reply. Menú contextual muestra "Reply with quote" cuando hay texto seleccionado. Al enviar, usa `inputMessageReplyToMessage` con `inputTextQuote`. EntityTranslator propaga `quoteText`/`quoteOffset` de GramJS. Strings i18n EN/RU/ES.

## [0.0.537] - 2026-06-17
### Añadido
- **Media Spoiler**: fotos y vídeos con `has_spoiler` se muestran con blur fuerte (20px) + animación shimmer CSS + overlay "Tap to reveal". Click revela el contenido. Skins aurora/iOS/macOS con overrides de backdrop-filter. Video.js ahora recibe `hasSpoiler` desde `getMedia`.

## [0.0.536] - 2026-06-17
### Añadido
- **Translation lang picker v2**: lista completa de ~80 idiomas (paridad con Web A) usando `Intl.DisplayNames` para nombres nativos. Campo de búsqueda con autoFocus filtra por nombre o código. Lista ordenada alfabéticamente según locale del navegador. Cache de labels en memoria.

## [0.0.535] - 2026-06-17
### Añadido
- **Translation inline**: traducción de mensajes con `messages.translateText` usando `peer+id` (cache server-side). Botón "Show original / Show translation" para alternar sin re-traducir gracias a cache en memoria por `chatId:messageId:langCode`.
- Strings i18n: `ShowOriginal` y `Translate` en EN/RU/ES.

### Cambiado
- `Message.css`: border-left de `.message-translation` ahora usa cascada `--accent → --accent-color → --color-accent-main → --message-in-reply-title` para soportar todos los skins. Overrides específicos para `design-android-holo` y `design-android-classic`.

## [2026-06-12] (sesión 28)

### Added
- **Waveform en notas de voz** — las notas de voz ahora muestran 60 barras de amplitud real decodificadas del campo `waveform` de TDLib (5 bits por muestra, base64). Las barras ya reproducidas se colorean en azul primario. Clic en cualquier punto hace seek si el audio está activo. Archivos: `VoiceNoteSlider.{js,css}`, `VoiceNote.js`.
- **Indicador "está escribiendo..."** — en el subtítulo del Header aparece en tiempo real quien está escribiendo: "Ana está escribiendo...", "Ana y Juan están escribiendo...", "3 personas están escribiendo...". Soporta también "grabando audio..." y "enviando archivo/foto...". El texto parpadea suavemente. El listener `updateUserChatAction` ya existía pero no mostraba nada. Archivo: `Header.js`, `Header.css`.
- **Toast "Copiado al portapapeles"** — snackbar de confirmación de 1.8 s que aparece al usar "Copiar texto" o "Copiar enlace" en el menú contextual de cualquier mensaje. Archivo: `Message.js`.

---

## [2026-06-12] (sesión 27)

### Added
- **Sugerencias de comandos de bot** — al escribir `/` en un chat privado con un bot aparece un panel flotante con todos los comandos disponibles (nombre + descripción). Click inserta el comando completo. Usa `getUserFullInfo` para cargar los comandos del bot. Archivos: `BotCommandSuggestions.{js,css}`, `InputBoxControl.js`.
- **Emoji animado grande** — los mensajes de tipo `messageAnimatedEmoji` (emoji solitario enviado en chats donde está soportado) se renderizan como un emoji de 80 px con animación de aparición. Al hacer clic rebota con una animación `pop`. Archivos: `AnimatedEmoji.{js,css}`, `Utils/Message.js`.
- **Estadísticas de canal** — botón 📊 en el header que aparece solo en canales (supergrupos con `is_broadcast`). Abre un diálogo con tarjetas de: Suscriptores (con delta ±), Vistas/post y Compartidos/post. Usa `Api.stats.GetBroadcastStats` vía GramJS. Archivos: `ChannelStatsDialog.{js,css}`, `Header.js`, `GramJsController._getChannelStats`.

---

## [2026-06-12] (sesión 26)

### Added
- **Guardar en Mensajes Guardados** — nueva opción en el menú contextual de cada mensaje (clic derecho). Reenvía el mensaje a tu chat "Mensajes Guardados" con una sola acción. Archivo: `Message.js`.
- **Opciones de reenvío avanzadas** — al reenviar mensajes, ahora aparecen dos checkboxes: "Enviar como copia (sin enlace al original)" y "Eliminar título/caption". Usan los parámetros `send_copy` y `remove_caption` de la API `forwardMessages`. Archivo: `ForwardDialog.js`.
- **Barra de reacciones rápidas en hover** — al pasar el ratón por cualquier mensaje aparece una barra flotante con 8 emojis frecuentes (👍 ❤️ 😂 😮 😢 🔥 🎉 👏). Un clic envía la reacción vía `setMessageReaction`. Animación de entrada y efecto scale en hover por emoji. Archivos: `QuickReactionBar.{js,css}`, `Message.js`.

---

## [2026-06-12] (sesión 25) — `e96f1ba9`

### Added
- **@Menciones autocomplete** — al escribir `@` en el compositor aparece un panel flotante con los miembros del grupo filtrados en tiempo real por nombre/username. Click inserta `@username` (o `@nombre`) y cierra el panel. Carga miembros una vez por chat vía `getSupergroupMembers`/`getBasicGroupFullInfo`. Archivos: `MentionAutocomplete.{js,css}`, `InputBoxControl.js`.
- **Toggle oscuro/claro rápido** — botón ☀️/🌙 en la cabecera de la lista de chats (junto a Tutorial). Conmuta entre `light` y `dark` sin abrir el ThemePicker completo. Archivo: `DialogsHeader.js`.
- **Vista previa de PDF inline** — icono 👁 junto al nombre de archivos `.pdf`. Si el archivo está descargado, abre un `<iframe>` con la URL de blob en un diálogo de pantalla casi completa. Si no está descargado, inicia la descarga. Archivo: `Document.js`.

---

## [2026-06-12] (sesión 24) — `c9bf1bf5`

### Added
- **GifPicker (Giphy)** — botón GIF en la barra izquierda del compositor. Abre un panel con GIFs en tendencia y búsqueda en tiempo real (debounce 350 ms). Click en un GIF lo envía como animación vía `InputMediaDocumentExternal`. Powered by Giphy API. Archivos: `GifPicker.{js,css}`, `InputBoxControl.js`, `GramJsController._sendGifByUrl`.
- **Búsqueda de mensajes en el chat** — barra `ChatSearch` que aparece bajo el header al pulsar 🔍. Muestra contador `N/Total`, navegación ▲▼ entre resultados. Usa `searchChatMessages` de TDLib. Archivos: `ChatSearch.{js,css}`, `Header.js`.
- **Temporizador de auto-borrado por chat** — botón ⏱ en el header abre un diálogo con opciones: Off / 1 día / 1 semana / 1 mes / 3 meses. Aplica el TTL vía `messages.SetHistoryTTL` de GramJS. Archivos: `AutoDeleteTimer.{js,css}`, `Header.js`, `GramJsController._setChatMessageAutoDeleteTime`.

---

## [2026-06-12] (sesión 23) — `f966bbc2`

### Added
- **"Visto por" en grupos** — mensajes salientes en grupos muestran los avatares de los usuarios que ya leyeron el mensaje (máx. 3 en línea + contador). Clic abre un modal con la lista completa de nombres. Usa `Api.messages.GetMessageReadParticipants` en GramJS. Archivos: `src/Components/Message/SeenBy.{js,css}`, `Message.js`, `GramJsController.js`.
- **Diálogo de atajos de teclado** — nuevo `KeyboardShortcutsDialog` con tabla visual de todos los atajos (navegación, mensajes, formato). Se activa pulsando `?` cuando el foco no está en un campo de texto. Disponible globalmente vía `MainMenuButton`. Archivos: `src/Components/Additional/KeyboardShortcutsDialog.{js,css}`, `MainMenuButton.js`.
- **Selector de idioma para traducción** — al pulsar "Traducir mensaje" en el menú contextual, aparece ahora un sub-menú con 10 idiomas (🇪🇸 ES · 🇬🇧 EN · 🇫🇷 FR · 🇩🇪 DE · 🇵🇹 PT · 🇮🇹 IT · 🇷🇺 RU · 🇨🇳 ZH · 🇯🇵 JA · 🇸🇦 AR) en lugar de traducir siempre a inglés. Archivo: `Message.js`.

---

## [2026-06-12] (sesión 22) — `1e3719a5`

### Added — compositor y mensajes
- **Botón de velocidad en notas de voz** — nuevo componente `VoiceNoteSpeedButton` dentro de `VoiceNote.js` que cicla entre 1×, 1.5× y 2× al hacer clic. Despacha `clientUpdateMediaPlaybackRate` para que el `PlayerStore` y el reproductor recojan el cambio en tiempo real. Archivos: `src/Components/Message/Media/VoiceNote.{js,css}`.
- **Toggle de previsualización de enlace** — botón 🔗 en la barra inferior del compositor que activa/desactiva la previsualización del enlace detectado. Cuando está desactivado el icono aparece en rojo. Pasa `disable_web_page_preview` al `GramJsController` que lo convierte en `noWebpage: true` en la llamada GramJS. Archivos: `InputBoxControl.js`, `GramJsController.js`.
- **Modal "¿Quién reaccionó?"** — nuevo componente `ReactorsModal.js` (Dialog de MUI) que llama a `Api.messages.GetMessageReactionsList` y muestra la lista de usuarios con avatar, nombre y emoji de reacción. Se abre haciendo **clic derecho** sobre cualquier burbuja de reacción en un mensaje. Archivos: `src/Components/Message/ReactorsModal.{js,css}`, `Reactions.js`, `GramJsController.js`.

---

## [2026-06-12] (sesión 21)

### Added — inspirado en Telegram Web A
- **Barra de formato flotante en el compositor** (`03bd2d13`) — al seleccionar texto en el campo de mensaje aparece un toolbar flotante con botones: **B** (negrita), *I* (cursiva), U (subrayado), ~~S~~ (tachado), `</>` (código monoespaciado), 👁 (spoiler), 🔗 (enlace), ✕ (quitar formato). Se posiciona sobre la selección usando `getBoundingClientRect()`. Los handlers ya existían como atajos de teclado (Ctrl+B/I/U/etc); ahora tienen UI visual accesible. Archivos: `src/Components/ColumnMiddle/InputBoxControl.js`, `InputBoxControl.css`.
- **Spoiler en compositor** (`03bd2d13`) — nuevo `handleSpoiler()` que inserta `<span class='spoiler-text'>` sobre el texto seleccionado, compatible con el renderizado de `textEntityTypeSpoiler` ya existente (blur + reveal al clic). Archivo: `InputBoxControl.js`.
- **FactCheck en mensajes de canales** (`03bd2d13`) — nueva función `translateFactCheck()` en `EntityTranslator.js` traduce `msg.factcheck` (campo capa 198 de GramJS). Nuevo componente `FactCheck.js` muestra la anotación con borde rojo y etiqueta `FACT CHECK · <país>` debajo del contenido del mensaje. Solo aparece si `factcheck.needCheck === false` y tiene texto. Archivos: `src/Components/Message/FactCheck.{js,css}`, `EntityTranslator.js`, `Message.js`.
- **Canales similares** (`03bd2d13`) — implementado `channels.GetChannelRecommendations` en `GramJsController._getSimilarChannels()`. Nuevo componente `SimilarChannels.js` en el panel derecho de info: lista de canales recomendados con avatar, nombre y número de miembros, clicables para abrir el canal. Solo visible en el panel de información de canales (supergrupo con `is_channel=true`). Archivos: `src/Components/ColumnRight/SimilarChannels.{js,css}`, `ChatDetails.js`, `GramJsController.js`.

---

## [2026-06-12] (sesión 20)

### Infraestructura
- **Despliegue en producción con Docker + Traefik** — añadidos `Dockerfile` (multi-stage node:18-alpine → nginx:alpine), `nginx.conf` (SPA fallback, gzip, cache headers) y `docker-compose.yml` con integración Traefik para `tg.todosobreall.tech`. (`f9165204`)
- **Fix `homepage` para despliegue en dominio raíz** — `package.json` tenía `homepage: http://evgeny-nadymov.github.io/telegram-react`, lo que causaba que el service worker pidiera assets desde `/telegram-react/...` con 404. Cambiado a `"/"`. (`5597af82`)
- **Fix build Linux en Docker** — `set NODE_OPTIONS=...` es sintaxis Windows; movido a `ENV` en el Dockerfile. Añadido `SKIP_PREFLIGHT_CHECK=true` para evitar el error de versión de ESLint. Cambiado `npm ci` → `npm install` por desincronización del lock file. (`2fa3f31b`, `954f4191`, `f636dd0c`)

### Fixed — Auth
- **Estabilización del login QR en Chrome** — cuatro fixes encadenados: esperar conexión activa antes de pedir el QR (`730c6064`), completar el login al recibir el update correspondiente (`c138c6eb`), regenerar el QR cuando el token expira (`14f9e473`) y eliminar race condition que causaba pantalla en blanco en Chrome (`07ebabea`).

### Documentación
- **README completo** — sustituido el README original por documentación detallada del fork: arquitectura, tabla de estado de funcionalidades, despliegue local y en producción, guía de contribución, headers de seguridad y hoja de ruta. (`d2a0a8c5`)

---

## [2026-06-10] (sesión 19)

### Fixed
- **ICE candidates perdidos en llamadas** — `_tryBuildRemoteSdp` limpiaba `_pendingCandidates` sin añadirlos al `RTCPeerConnection`. Ahora se hace `addIceCandidate` individual con `try/catch` por candidato antes de vaciar el array. Archivo: `src/Controllers/CallController.js`.
- **Verificación g_a_hash anti-MITM** — el callee ahora verifica `SHA-256(g_a) == g_a_hash` antes de completar el DH. Si no coincide aborta con `discardCall`. Archivo: `src/Controllers/CallController.js`.
- **Timeout de signaling queue** — si `_authKey` no llega en 10 segundos, la cola de señalización se vacía y el timer se cancela en `_cleanup()`. Archivo: `src/Controllers/CallController.js`.
- **`gb` undefined en `phone.AcceptCall`** — `Buffer.from(Uint8Array)` no produce un Buffer válido en el polyfill del navegador. Se corrigió usando `Buffer.from(uint8.buffer, byteOffset, byteLength)`. Archivo: `src/Controllers/GramJsController.js`.
- **Derivación de msgKey incorrecta en tgcalls** — `encodeSignalingMessage` usaba offset `128+x` (incorrecto) y tomaba 32 bytes del authKey en lugar de 36. Corregido a `x = isOutgoing ? 0 : 8` y 36 bytes, según la spec MTProto2 P2P. Archivo: `src/lib/TgCallsSignaling.js`.
- **AES-CTR counter width 64→128 bits** — tgcalls usa `CRYPTO_ctr128_encrypt` de OpenSSL (contador de 128 bits completo). Web Crypto con `length:64` diverge a partir del segundo bloque. Corregido a `length:128`. Archivo: `src/lib/TgCallsSignaling.js`.
- **`contextMenu`, `left`, `top` sin valor inicial en Message** — causaban `prop open=undefined` y `anchorPosition.left=undefined` en el `Popover` de Material-UI. Inicializados a `false`/`0` en el constructor. Archivo: `src/Components/Message/Message.js`.
- **`base64url` no soportado en polyfill de Buffer** — `Buffer.toString('base64url')` falla en el navegador. Convertido manualmente desde base64 estándar (`+`→`-`, `/`→`_`, sin `=`). Archivo: `src/Controllers/GramJsController.js`.
- **`options=null` en Autocomplete del login** — `data` llega como `null` mientras se cargan los países. Cambiado a `options={data || []}`. Archivo: `src/Components/Auth/Phone.js`.
- **HTTPS en servidor de desarrollo** — añadido `HTTPS=true` al `.env` para que el dev server corra en `https://localhost:3000` y Firefox/Chrome no bloqueen las conexiones `wss://` a los servidores de Telegram.

---

## [2026-06-10] (sesión 18)

### Fixed
- **Claves React duplicadas en MessagesList** — `history` podía contener el mismo mensaje dos veces (por ejemplo tras recibir la notificación de una llamada terminada), causando el warning "Encountered two children with the same key". El render ahora deduplica por `(chat_id, id)` antes de renderizar, usando `uniqueHistory` también para calcular `prevMessage` / `nextMessage`. Archivo: `src/Components/ColumnMiddle/MessagesList.js`.
- **Protocolo tgcalls (llamadas con cliente oficial Android)** — los mensajes de señalización P2P ahora se encriptan con AES-CTR + gzip tal como especifica el protocolo tgcalls, en lugar de enviarse como JSON plano. Se corrigió el flag `isOutgoing` (antes invertido en ambos extremos) y una race condition en el callee que llamaba `_startWebRTC` antes de que el DH key exchange terminara (`_onCallConfirmed` ahora es `async` y hace `await _finishCalleeDH`). Archivos: `src/Controllers/CallController.js`, `src/lib/TgCallsSignaling.js`.

---

## [2026-06-10] (sesión 17)

### Added
- **Llamadas de voz y videollamadas P2P** — implementación completa de llamadas 1-a-1 usando WebRTC + señalización MTProto vía GramJS. Flujo completo: Diffie-Hellman key exchange (`messages.GetDhConfig`, `g^a mod p`, `sha256(g_a_hash)`), `phone.RequestCall` / `phone.AcceptCall` / `phone.ConfirmCall` / `phone.DiscardCall`. Datos de señalización WebRTC (SDP offer/answer + ICE candidates) intercambiados vía `phone.SendSignalingData` / `UpdatePhoneCallSignalingData`. Archivos nuevos: `src/Controllers/CallController.js`, `src/Components/Calls/IncomingCall.{js,css}`, `src/Components/Calls/ActiveCall.{js,css}`.
- **UI de llamada entrante** — overlay con avatar pulsante, nombre del contacto, botones de aceptar (verde) y rechazar (rojo). Se activa automáticamente al recibir `UpdatePhoneCall` con `phoneCallRequested`. El overlay tiene mayor z-index que todo el resto de la UI.
- **UI de llamada activa** — panel con temporizador de duración (MM:SS), botones de mute, cámara (en videollamadas) y colgar. Para videollamadas muestra el stream remoto a pantalla completa y el propio stream local en una ventana pequeña (picture-in-picture). Archivos: `src/Components/Calls/ActiveCall.{js,css}`.
- **Botones de llamada en el Header** — en chats privados aparecen dos botones (teléfono y cámara) al lado del botón de búsqueda. Al pulsar se inicia la llamada de voz o video respectivamente. Solo visibles cuando `isPrivateChat(chatId)` es verdadero. Archivos: `src/Components/ColumnMiddle/Header.js`.
- **UpdatePhoneCall / UpdatePhoneCallSignalingData en UpdateTranslator** — los updates `PhoneCallRequested`, `PhoneCallAccepted`, `PhoneCall`, `PhoneCallDiscarded`, `PhoneCallWaiting` se traducen al formato interno y se despachan al `CallController`. Archivos: `src/Utils/GramJs/UpdateTranslator.js`.
- **Métodos de llamada en GramJsController** — `requestCall`, `acceptCall`, `confirmCall`, `discardCall`, `sendCallSignalingData`, `getDhConfig` implementados vía `Api.phone.*`. El DH key exchange usa BigInt nativo del navegador para aritmética modular de 2048 bits. Archivos: `src/Controllers/GramJsController.js`.

---

## [2026-06-10] (sesión 16)

### Added
- **Editar perfil** (`2103ab15`) — panel lateral accesible tocando el área del perfil en Settings. Permite cambiar nombre, apellido, bio (70 chars) y username (solo alfanumérico + `_`). Llama a `account.UpdateProfile` y `account.UpdateUsername`; emite `updateUser` de forma inmediata para que el nombre se refleje en la UI sin recargar. Archivos: `src/Components/Additional/EditProfile.{js,css}`, `src/Components/ColumnLeft/AndroidSettings.js`, `src/Controllers/GramJsController.js`.
- **Saltar a fecha en el historial** (`2103ab15`) — botón de calendario 📅 en el header del chat abre un diálogo con `<input type="date">` nativo. Al confirmar, `getChatMessageByDate` usa `messages.GetHistory` con `offsetDate` para obtener el primer mensaje a partir de esa fecha y lo resalta con `highlightMessage`. Archivos: `src/Components/ColumnMiddle/Header.js`, `src/Controllers/GramJsController.js`.
- **Resultados de encuestas en tiempo real** (`2103ab15`) — `UpdateMessagePoll` de GramJS ahora se traduce a `updatePoll` con votos, porcentajes e `is_chosen` actualizados. El `_setupUpdateHandler` de GramJsController busca en el `MessageStore` todos los mensajes con ese `poll.id` y emite `updateMessageContent` para que `Poll.js` re-renderice con los nuevos conteos sin necesidad de recargar el chat. Archivos: `src/Utils/GramJs/UpdateTranslator.js`, `src/Controllers/GramJsController.js`.

---

## [2026-06-10] (sesión 15)

### Added
- **Teclados inline** (`f951adac`) — los mensajes de bots ahora muestran sus botones interactivos debajo de la burbuja. Nuevo componente `InlineKeyboard.js` que renderiza filas de botones; soporta tipos `url`, `callback`, `webApp`, `switchInline`, `game`, `buy`, `user`. Los botones callback muestran la respuesta del servidor con un toast flotante (`callback-toast`). Archivos: `src/Components/Message/InlineKeyboard.{js,css}`, `src/Components/Message/Message.js`, `src/Utils/GramJs/EntityTranslator.js`, `src/Controllers/GramJsController.js`.
- **Callback query (`getCallbackQueryAnswer`)** (`f951adac`) — handler en `GramJsController` vía `messages.GetBotCallbackAnswer`; devuelve texto, alerta y URL opcionales. Si la respuesta trae `show_alert=true` se usa `window.alert`, si no se muestra el toast.
- **`translateReplyMarkup`** (`f951adac`) — nueva función exportada en `EntityTranslator.js` que convierte `ReplyInlineMarkup` → `replyMarkupInlineKeyboard` y `ReplyKeyboardMarkup` → `replyMarkupShowKeyboard` incluyendo flags `resize`, `one_time` y `selective`.
- **Hilos de comentarios** (`14c5b29e`) — los posts de canal con replies muestran un botón "X comments" (o "Leave a comment") debajo de la burbuja. Al pulsar abre un panel lateral que carga el hilo de respuestas con `messages.GetReplies`. Nuevo `CommentsButton.js` y `MessageThread.js`; singleton montado en `MainPage` vía `window._messageThreadRef`. Archivos: `src/Components/Message/CommentsButton.{js,css}`, `src/Components/Additional/MessageThread.{js,css}`, `src/Components/MainPage.js`, `src/Controllers/GramJsController.js`.
- **Bot Mini Apps / Web Apps** (`e79d9155`) — botones `inlineKeyboardButtonTypeWebApp` abren un panel lateral con iframe en lugar de pestaña externa. Sandbox correcto: `allow-scripts allow-same-origin allow-forms allow-popups`. Nuevo `BotWebApp.js`; singleton `window._botWebAppRef` en `MainPage`. Archivos: `src/Components/Additional/BotWebApp.{js,css}`, `src/Components/MainPage.js`, `src/Components/Message/InlineKeyboard.js`.
- **Slow Mode para admins de supergrupos** (`e79d9155`) — selector dropdown en la info del chat (desactivado / 10s / 30s / 1min / 5min / 15min / 1h) visible solo para administradores de supergrupos. Lee `slow_mode_delay` de `supergroupFullInfo` (nuevo campo `full.slowmodeSeconds`); llama a `channels.ToggleSlowMode`. Archivos: `src/Components/ColumnRight/ChatDetails.js`, `src/Controllers/GramJsController.js`.
- **Votar en encuestas** (`ea47b357`) — `setPollAnswer` implementado vía `messages.SendVote`; mapea índice de opción → bytes binarios (`_option_data`) guardados en el translator. Tras votar recarga el mensaje para refrescar resultados en el UI. También implementado `stopPoll` vía `messages.EditMessage` con `poll.closed=true`. Archivos: `src/Controllers/GramJsController.js`, `src/Utils/GramJs/EntityTranslator.js`.
- **Sesiones activas conectadas a Settings** (`ea47b357`) — el botón "Devices" en AndroidSettings ahora abre el diálogo `ActiveSessions` (que ya existía pero no estaba conectado). Implementados `getActiveSessions` (`account.GetAuthorizations`), `terminateSession` (`account.ResetAuthorization`) y `terminateAllOtherSessions` (`auth.ResetAuthorizations`). Archivos: `src/Components/ColumnLeft/AndroidSettings.js`, `src/Controllers/GramJsController.js`.

---

## [2026-06-10] (sesión 14)

### Added
- **Blockquote collapse toggle** (`08f02254`) — los blockquotes con `is_collapsed=true` muestran botón `···` para expandir y `▲` para colapsar. Nuevo `CollapsibleBlockquote.js` con estado local React. Archivos: `src/Components/Message/CollapsibleBlockquote.js`, `src/Components/Message/Message.css`, `src/Utils/Message.js`.
- **Ver y eliminar mensajes programados** (`914b0e04`) — nuevo botón "Mensajes programados" en el menú ⋮ del chat. Muestra la lista con fecha de envío y permite borrar entradas individuales. Nuevo `ScheduledMessages.js`; handlers `getChatScheduledMessages` y `deleteChatScheduledMessages` en `GramJsController` usando `messages.GetScheduledHistory` / `messages.DeleteScheduledMessages`. Archivos: `src/Components/Additional/ScheduledMessages.js`, `src/Components/ColumnMiddle/MainMenuButton.js`, `src/Controllers/GramJsController.js`.
- **Auto-delete timer (TTL de mensajes)** (`0e6d2400`) — selector "Borrado automático" en la info del chat (off/1 día/1 semana/1 mes). `translateChat` propaga `message_ttl` desde `dialog.ttlPeriod`; `setChatMessageTtl` en `GramJsController` vía `messages.SetHistoryTTL`; `updateChatMessageTtl` manejado en `ChatStore`; `ChatDetails` escucha el evento y re-renderiza. Archivos: `src/Utils/GramJs/EntityTranslator.js`, `src/Controllers/GramJsController.js`, `src/Stores/ChatStore.js`, `src/Components/ColumnRight/ChatDetails.js`.
- **Layout responsive para móvil** (`03bf7ae2`) — en pantallas ≤600px: columna de diálogos o columna de chat visibles según si hay chat activo (atributo `data-chat-active`). Botón `ArrowBack` en el header del chat (oculto en desktop) para volver a la lista. `MainPage` rastrea `activeChatId` y escucha `clientUpdateChatId`. Archivos: `src/TelegramApp.css`, `src/Components/ColumnLeft/Dialogs.css`, `src/Components/ColumnMiddle/DialogDetails.css`, `src/Components/ColumnMiddle/Header.js`, `src/Components/ColumnMiddle/Header.css`, `src/Components/MainPage.js`.
- **Verificación en dos pasos (2FA)** (`3b0373c8`) — pantalla completa accesible desde Settings → Privacy and Security. Flujos: ver estado, activar con nueva contraseña+pista, cambiar y desactivar. Nuevo `TwoStepVerification.js`; handlers `getTwoStepVerificationStatus` (`account.GetPassword`) y `setTwoStepVerificationPassword` (`client.updateTwoFaSettings`) en `GramJsController`. Archivos: `src/Components/Additional/TwoStepVerification.js`, `src/Components/ColumnLeft/AndroidSettings.js`, `src/Controllers/GramJsController.js`.

---

## [2026-06-09] (sesión 13)

### Added
- **Modo lectura en AmpViewer** (`695e7c99`) — botón de toggle en la cabecera del visor AMP (icono `Subject`/`Web`) que extrae el artículo del HTML AMP y lo renderiza de forma nativa sin iframe. Pipeline de fetch con 3 fuentes: Google AMP Cache → Cloudflare AMP Cache → URL original directa. Si todas fallan por CORS o falta de AMP, usa los datos del mensaje de Telegram (`title`, `description`, `site_name`) como fallback "lite". Badge cambia a `LEER` (texto completo) o `VISTA` (modo lite). Preferencia guardada en `localStorage`. Dark theme completo. Archivos: `src/Components/AmpViewer/AmpViewer.{js,css}`.
- **Caché LRU de contenido AMP** (`695e7c99`) — nuevo `src/Stores/AmpCache.js` (mismo patrón LRU de 30 entradas que `InstantViewCache`). El contenido extraído se guarda por URL; reabriendo el mismo artículo es instantáneo sin ninguna petición de red. Archivo: `src/Stores/AmpCache.js`.
- **Sanitizador HTML sin dependencias externas** (`695e7c99`) — DOM walker con whitelist estricta de tags (`p`, `h1-h6`, `img`, `a`, `blockquote`, `ul/ol/li`, tablas, etc.) y atributos seguros. Convierte `<amp-img>` a `<img>`, bloquea `javascript:` y `data:` URIs, elimina scripts/ads/navs del contenido extraído. Sin DOMPurify.
- **`webPage` propagado a AmpViewer** (`695e7c99`) — `openAmpViewer(url, webPage)` y `closeAmpViewer()` incluyen el objeto `web_page` del mensaje en el `clientUpdate`; `MainPage` lo pasa como prop a `<AmpViewer>` para que el fallback lite siempre tenga datos.
- **Caché LRU de Instant View** (`bd6a0e97`) — nuevo `src/Stores/InstantViewCache.js` (50 entradas). Al recibir un mensaje con `webPage.cachedPage`, el IV traducido se guarda automáticamente; `_getWebPageInstantView` lo sirve sin llamar a `GetWebPage` si ya está en caché. Archivos: `src/Stores/InstantViewCache.js`, `src/Utils/GramJs/EntityTranslator.js`, `src/Controllers/GramJsController.js`.
- **Entidades en opciones de encuesta** (`bd6a0e97`) — `translatePoll` ahora preserva `text_entities` en cada opción de `PollAnswer` (campo additive, backward-compatible con `PollOption.js`). Archivos: `src/Utils/GramJs/EntityTranslator.js`.
- **Render de `textEntityTypeBlockQuote`** (`bd6a0e97`) — nueva entidad de layer 198 renderizada como `<blockquote class="message-blockquote">` (o `collapsed` si `is_collapsed === true`). Borde izquierdo con `--message-in-reply-title` coherente con todos los skins. Archivos: `src/Utils/Message.js`, `src/Components/Message/Message.css`.
- **`messageEntityBlockquote` en el mapa de traducción** (`bd6a0e97`) — añadido al mapa de `EntityTranslator.js` con propagación del flag `collapsed` de layer 198. Archivo: `src/Utils/GramJs/EntityTranslator.js`.

### Fixed
- **Memory leaks y race conditions en AmpViewer** (`210f491f`) — añadido flag `_mounted` para proteger todos los `setState` en código asíncrono (`_loadReaderContent` y el callback del timer). `componentDidMount` ya no llama a `_loadReaderContent` cuando el contenido ya está en el estado desde el constructor (doble lectura de caché). `closeAmpViewer` ahora envía `webPage: null` explícitamente. Archivo: `src/Components/AmpViewer/AmpViewer.js`, `src/Actions/Client.js`.
- **Pantalla en blanco al activar modo lectura** — `setState({ readerMode: true, readerLoading: true })` en un solo dispatch elimina el render intermedio con `readerMode=true` y sin contenido. `renderReaderBody` muestra spinner mientras `readerLoading || !readerContent` (no hay pantalla blanca). Archivo: `src/Components/AmpViewer/AmpViewer.js`.
- **`ReferenceError: readerContent` en render()** — `readerContent` no estaba desestructurado del estado pero se usaba en el JSX del badge (`readerContent?.lite`), causando crash completo del app. Archivo: `src/Components/AmpViewer/AmpViewer.js`.
- **Filtros de búsqueda inalcanzables** (`7ecf67ed`) — `getSearchMessagesFilter()` tenía `return null` literal antes de los returns de filtro en los casos `messageVideoNote`, `audio`, `voiceNote` y `videoNote` dentro de `messageText`. Los cuatro filtros nunca se devolvían. Archivo: `src/Utils/Message.js`.

### Notes
- El botón de modo lectura se oculta silenciosamente (sin mostrar error) cuando ninguna fuente devuelve contenido útil y tampoco hay datos del mensaje disponibles.
- Los tres fetch (Google AMP Cache, Cloudflare, URL original) se intentan secuencialmente; si el contenido extraído tiene menos de 100 caracteres visibles se descarta como página de error del CDN.
- `textEntityTypeBlockQuote` con `collapsed` está renderizado visualmente pero el toggle expand/collapse queda pendiente (`// TODO`).

---

## [2026-05-31] (sesion 12)

### Added
- **Accesos para reabrir el tutorial** (`cad0c279`) - boton de ayuda en la cabecera de escritorio y entrada "Tutorial" en el drawer Android.
- **Tutorial con demostraciones visuales** (`cad0c279`) - cada paso muestra una mini demo contextual: busqueda, mensajes, historias, disenos, articulos rapidos, atajos y una vista general accesible con "Ver demo".
- **Numero de version visible** - el selector inferior de diseno muestra la version actual de la app desde `package.json`.

### Fixed
- **Congelacion al hacer scroll en la lista de chats** (`015cbb76`) - `getChats` ahora respeta `limit`/`offset` y `DialogsList` evita concatenar chats duplicados.
- **Solape visual en busqueda** (`015cbb76`) - la fila horizontal "People" ya no usa posicionamiento absoluto que pisaba los resultados de chats.

### Notes
- **Build verificada**: `npm run build` compila correctamente tras los cambios.

---

## [2026-05-31] (sesión 11)

### Added
- **Emoji personalizado/animado inline** (`6473b65`) — render de custom emoji en el texto con carga perezosa (`IntersectionObserver`): `.tgs`→Lottie, `.webm`→vídeo, estático→img, con fallback Unicode. Nuevo `CustomEmoji.{js,css}`; `getCustomEmojiDocuments` (lotes de 200) en `GramJsController`; detección de `DocumentAttributeCustomEmoji` y `textEntityTypeCustomEmoji`. Archivos: `src/Components/Message/CustomEmoji.{js,css}`, `src/Controllers/GramJsController.js`, `src/Utils/GramJs/EntityTranslator.js`, `src/Utils/Message.js`.
- **Historias (Stories)** (`29ec513`) — lectura completa: tray horizontal con anillos (no leídas en degradado, leídas en gris) y visor a pantalla completa con progreso segmentado, navegación tap/hold, cierre por swipe/Esc, auto-avance y marcado de leído. Nuevo `StoryStore`/`StoriesTray`/`StoryViewer`; handlers `updateStory`/`updateReadStories` y casos `getActiveStories`/`getStory`/`readStories`. Archivos: `src/Stores/StoryStore.js`, `src/Components/Stories/*`, `src/Utils/GramJs/{EntityTranslator,UpdateTranslator}.js`, `src/Controllers/GramJsController.js`.
- **Botones AMP e Instant View independientes** (`203252e`) — en la preview de web, IV y AMP dejan de ser excluyentes; si hay ambos, salen los dos botones. Archivos: `src/Components/Message/Media/WebPage.{js,css}`.
- **Visor AMP** (`ff77663`) — lector en modal con caché de Google y fallback a Cloudflare; arreglos móvil: dark mode, altura `dvh`, scroll iOS, `allow-modals`, bloqueo de scroll de fondo, i18n. Archivos: `src/Components/AmpViewer/AmpViewer.{js,css}`.
- **Estilo base del reproductor de audio** (`a4cd68f`) — `Audio.css` (antes vacío) con estilo autosuficiente y variables de tema; el audio se ve bien en todos los skins, no solo Android. Archivos: `src/Components/Message/Media/Audio.{js,css}`.

### Changed
- **Fuente única de diseños** (`651670b`) — `DesignSwitcher` deja su lista `QUICK_DESIGNS` hardcodeada y usa `DESIGNS` de `Design.js`; menú "Switch design" reducido a 8 desde una única fuente. Archivos: `src/Components/DesignSwitcher.js`, `src/Design.js`.
- **Variantes Android válidas-pero-ocultas** (`397b0b5`) — `getDesign`/`setDesign` validan contra `ALL_DESIGNS`; las eras (Holo, v9, v11, v13–v15) salen del menú principal pero siguen aplicables desde `AndroidVersionSelector`. Archivo: `src/Design.js`.

### Fixed
- **Congelación al responder a mensajes borrados** (`8c45626`) — `Reply.onGetMessageResult` accedía a `result.chat_id` sin comprobar null; guarda `if (!result) return` + filtrado en `loadReplies`. Archivos: `src/Components/Message/Reply.js`, `src/Utils/File.js`.
- **Congelación al buscar con muchos resultados** (`4806d77`) — render progresivo de 20 en 20 (antes montaba 108+ de golpe). Archivo: `src/Components/ColumnLeft/Search/Search.js`.
- **Etiqueta "AMP" invisible** (`203252e`) — un `!important` pintaba el texto del color del fondo; eliminados los overrides para que MUI gestione el color. Archivos: `src/Components/Message/Media/WebPage.{js,css}`.
- **Tokens del tray de historias en dark Android** (`250f86a`) — usaba variables inexistentes (`--background-color`); cambiadas a `--design-sidebar-background`/`--design-border-color`/`--design-muted-color` con fallback. Incluye limpieza de mock/logs de debug. Archivo: `src/Components/Stories/StoriesTray.css`.
- **Reintento de descarga en `CONNECTION_NOT_INITED`** (`daf76a9`) — `_downloadFile` reintenta 2 veces (300/600 ms); arregla avatares que no cargaban al primer intento. Archivo: `src/Controllers/GramJsController.js`.
- **"Emoji doble" en el input** (`3061881`) — `inputbox-left-column` tenía dos botones con icono de carita (emoji + stickers); generalizado el ocultado del botón de stickers a todos los skins. Archivo: `src/Components/ColumnMiddle/InputBoxControl.css`.
- **Reply, reacciones y avatares sin color** (`7a8e3f1`) — `current` y `tdesktop` no definían `--color-accent-main` (reply/reacciones invisibles) y `--tile-1..8` no estaba definido (avatares sin color); definidos el acento propio de cada skin y la paleta de tiles en `shell.css :root`. Archivos: `src/designs/{current,tdesktop,shell}.css`.

### Reverted
- **Tandas "estilo Android para todos"** (`5766fb5`, `2045a62` → revertidos en `055ef8f`, `9002a0a`) — llevar FAB, gradientes de avatar, header master y spoiler azul al resto de skins vía reglas base `body[class*='design-']` homogeneizaba e imponía la estética de Android, rompiendo la identidad de cada diseño (un FAB no pertenece a macOS/iOS/Desktop). Revertido por completo; los arreglos legítimos que arrastró (acentos, avatares) se re-aplicaron de forma neutra en `7a8e3f1`.

### Notes
- Los 9 `src/designs/*.css` quedan verificados byte-idénticos al estado pre-sesión salvo `shell.css` (solo la paleta `--tile-N`). Ningún skin perdió su identidad.
- Análisis estático: CSS válido en los 9 skins, sin null-derefs/JSON sin proteger/fugas de listeners, y tokens `--design-*` cubiertos.

---

## [2026-05-30] (sesión 10)

### Added — Diseños Android: novedades de Telegram adaptadas por variante

- **Telegram X** — nuevo skin independiente (`src/designs/telegramx.css`): cabecera con degradado azul, burbujas salientes azules (no verdes), acento `#50a8eb`, radio 18px, input pill 24px, fondo `#eff3f8`, modo oscuro `#111b25`/`#1c2733`.
- **Selector de versiones Android** (`AndroidVersionSelector.js`) — ampliado con 3 entradas nuevas: Android Holo (4.x), v9 (6.x Folders), v11 (8.x 2021). El desplegable junto a la lupa muestra ahora 7 eras históricas.
- **Variantes Android históricas en `android.css`** — tres nuevas variantes `design-android-holo`, `design-android-v9`, `design-android-v11` como extensiones lean sobre la base `design-android` (herencia vía `setDesign()` que aplica las dos clases).
- **Corrección icono flotante en inputbox** — `.inputbox-left-column` con dos iconos apilados causaba overflow sobre la burbuja; fix: `flex-direction: row; align-items: flex-end` + ocultación del botón separado de stickers, aplicado en la base `body.design-android` para que todas las variantes lo hereden.
- **Colores de avatar por variante** — `tile_color_1…8` con degradados o planos coherentes con cada era: gradientes modernos para redesign/v11, planos para v9 y holo, con tinte teal para glass.
- **Scrollbar personalizado por variante** — `width: 4px` con color accent de cada era en redesign, glass, v11 y classic.
- **Reacciones (`.reaction-bubble`)** — radio, color de borde, fondo hover y estado elegido adaptados por era: cuadrado en holo/classic, chips en v9, pill en glass, intermedios en v11/redesign.
- **Spoiler de texto (`.spoiler-text`)** — efecto blur que se revela al clic; color de fondo y radio coherentes con cada variante (2px holo, 10px glass, etc.).
- **Reply quote (`.border`)** — borde izquierdo de cita en el accent de cada variante; degradado teal en glass.
- **Story rings (`.tile-photo`)** — outline/box-shadow alrededor de avatares, morfología distinta por era: cuadrado teal en holo, redondeado con radio 14px en v9, circular en v11/redesign/glass, glow teal con `box-shadow` en glass.
- **Folder tabs activos** — `.folder-tab-active` coloreado en accent por variante donde aplica (v9, v11).
- **Badge de no leídos** — `border-radius` coherente con la era: 2px en holo/classic, 10px en v9, 12px en v11, pill en glass/redesign.
- **Day-meta pill** — radio ajustado por era: 4px en classic/holo, 14px en v9, 16px en v11, 999px en glass/redesign.
- **Inputbox bubble por variante** — pill 24px en redesign, 20px en v11, translúcido con borde teal en glass.
- **Dark mode** — modo oscuro completo para classic (antes parcial); variables de reacciones en dark para android base, holo, v9 y glass.
- **FAB (`.dialogs::after`)** — `box-shadow` con glow del accent correcto en classic, redesign y v11.
- **Iconos de header en accent** — `.header-master .MuiIconButton-root` en color accent para glass, redesign, v11.
- **Telegram X en `QUICK_DESIGNS`** — añadido al selector rápido de diseño (era invisible por estar solo en `Design.js` pero no en `DesignSwitcher.js`).

---

## [2026-05-30] (sesión 9)

### Added
- **Sistema de diseños visuales independientes del tema claro/oscuro**: nuevo gestor `Design.js` con persistencia en `localStorage` (`tg_design`), inicialización global en `index.js` y clases `body.design-*` para activar skins completas de la interfaz. Archivos: `src/Design.js`, `src/index.js`.
- **Selector de diseño en Appearance**: `ThemePicker` ahora permite elegir entre Telegram Web, Android, iOS, macOS, TDesktop, Unigram y Aurora con mini previews visuales de sidebar, fondo de chat y burbujas. Archivo: `src/Components/ColumnLeft/ThemePicker.js`.
- **Capa compartida de tokens CSS para skins**: nuevo `designs/shell.css` centraliza variables de superficie, sidebar, paneles, headers, composer, lista de chats, burbujas, radios, sombras, estados hover/activo y colores secundarios. Archivo: `src/designs/shell.css`.
- **Skin Telegram Web actual**: `current.css` documenta y fija el diseño base para mantener la apariencia original como opción seleccionable. Archivo: `src/designs/current.css`.
- **Skin Android**: nueva apariencia inspirada en Telegram Android clásico, con sidebar blanco, fondo de chat verde salvia, burbujas blancas/verde claro, acento azul Telegram, composer redondeado, scrollbar fino y variante dark. Archivo: `src/designs/android.css`.
- **Versiones Android simplificadas**: el selector de apariencia muestra una sola familia Android con versiones consecutivas `Android v16`, `Android v15`, `Android v14` y `Android v13`, evitando nombres mezclados de beta, classic, fechas o builds internas. Cada versión mantiene sus ajustes propios de radios, fondos, burbujas, sidebar, headers, composer y modo dark. Archivos: `src/Design.js`, `src/Theme.js`, `src/Components/ColumnLeft/ThemePicker.js`, `src/designs/android.css`.
- **Selector rapido de diseno adaptativo**: el control inferior izquierdo ahora usa los tokens del diseno activo y cambia entre familias Web, Desktop, Android, iOS, macOS, Unigram y Aurora, dejando Android como una unica familia. Archivos: `src/Components/DesignSwitcher.js`, `src/Components/DesignSwitcher.css`, `src/Components/MainPage.js`, `src/Design.js`.
- **Selector de versiones Android en header**: al activar Android aparece un desplegable compacto junto al buscador para cambiar entre `Android v16`, `Android v15`, `Android v14` y `Android v13`, con etiquetas de build y badges de estilo al modo de la plantilla. Archivos: `src/Components/ColumnLeft/AndroidVersionSelector.js`, `src/Components/ColumnLeft/AndroidVersionSelector.css`, `src/Components/ColumnLeft/DialogsHeader.js`.
- **Android refinado con plantilla UI Kit**: las variantes Android incorporan tokens de la plantilla standalone: acento `#229af0`, fondo de chat `#d2dcc4` con radiales suaves, burbuja saliente `#efffde`, avatares con gradiente vertical, classic con actionbar azul `#527da3` y beta glass con fondo `#e9eff0` y brillos teal. Archivo: `src/designs/android.css`.
- **Skin iOS**: nueva apariencia con burbujas azules iPhone, entrantes grises, tipografía `-apple-system`, headers/composer con efecto frosted, scrollbar oculto y variante dark. Archivo: `src/designs/ios.css`.
- **Skin macOS**: nueva apariencia de escritorio estilo macOS con sidebar clara, layout compacto, radios amplios, burbujas redondeadas y ajustes propios de header/composer. Archivo: `src/designs/macos.css`.
- **Skin TDesktop**: nueva apariencia inspirada en Telegram Desktop, con medidas compactas, acento azul, fondos y burbujas similares al cliente nativo. Archivo: `src/designs/tdesktop.css`.
- **Skin Unigram**: nueva apariencia inspirada en el cliente Unigram/Windows, con tipografía Segoe UI, superficies claras, filas compactas y burbujas con estilo propio. Archivo: `src/designs/unigram.css`.
- **Skin Aurora**: nuevo diseño oscuro original con acento mint/teal, sidebar oscuro, burbujas sin cola, tipografía Manrope/Inter, scrollbars personalizados y modo dark forzado. Archivo: `src/designs/aurora.css`.

### Changed
- **Tema MUI adaptado por diseño**: `Theme.js` ahora ajusta radio de bordes, acento, fuente y tipo efectivo según el skin seleccionado; Aurora fuerza dark y varios diseños sobreescriben el color primario. Archivo: `src/Theme.js`.
- **Clases globales de tema**: al recalcular el tema se aplican `theme-light` o `theme-dark` en `body`, permitiendo combinar reglas por tema y diseño (`body.theme-dark.design-*`). Archivo: `src/Theme.js`.
- **Tokens visuales compartidos en componentes existentes**: mensajes, respuestas, reacciones, web previews, metadatos de día, servicios, tiles de chat, headers, login y layout base usan variables CSS para responder al diseño activo. Archivos: `src/index.css`, `src/TelegramApp.css`, `src/Components/Message/*.css`, `src/Components/Tile/*.css`, `src/Components/ColumnMiddle/Header.css`, `src/Components/Auth/*.css`.
- **Acentos por diseño**: Android, iOS, macOS, TDesktop, Unigram y Aurora pueden imponer su color de acento para que iconos, enlaces, badges y Material UI acompañen al skin seleccionado. Archivos: `src/Theme.js`, `src/designs/*.css`.

### Fixed
- **Pantalla blanca en `/telegram-react/`**: `BrowserRouter` ahora usa `basename={process.env.PUBLIC_URL || '/'}` y ruta `/`, por lo que el build de producción montado bajo `/telegram-react/` renderiza correctamente. Archivo: `src/index.js`.
- **Crash de Material UI por color inválido**: `Theme.js` normaliza el color primario y `ThemePicker` cae a azul por defecto cuando una cookie antigua o un diseño con acento propio deja un color no reconocido. Archivos: `src/Theme.js`, `src/Components/ColumnLeft/ThemePicker.js`.
- **Servidor local estático para probar builds**: nuevo script Node que sirve `build/` en `localhost:3000` con fallback a `index.html` y soporte para el prefijo `/telegram-react`. Archivo: `scripts/local-static-server.js`.

### Notes
- **Build verificada**: `npm run build` compila correctamente con las nuevas apariencias.
- **Lint pendiente de configuración**: `npm run lint` no llega a analizar el código porque la versión instalada de ESLint no reconoce `env.es2021` en `.eslintrc.json`.

---

## [2026-05-21] (sesión 8)

### Added
- **Actualizaciones de nombre de usuario en tiempo real** (`UpdateTranslator.js`): `UpdateUserName` ahora emite `updateUser` con el nuevo nombre/apellido/username; los cambios de nombre de contactos se reflejan sin recargar. Archivo: `src/Utils/GramJs/UpdateTranslator.js`.
- **Actualizaciones de foto de perfil en tiempo real** (`UpdateTranslator.js`): `UpdateUserPhoto` emite `updateUser` con la nueva foto de perfil usando `translateUserProfilePhoto`. Archivo: `src/Utils/GramJs/UpdateTranslator.js`.
- **Actualizaciones de membresía en tiempo real** (`UpdateTranslator.js`): `UpdateChatMember` y `UpdateChannelParticipant` emiten `updateChatMember` con el estado anterior/nuevo del miembro (member, admin, banned, left, creator). Archivo: `src/Utils/GramJs/UpdateTranslator.js`.
- **Formato de texto al enviar mensajes** (`GramJsController.js`): `_sendMessage` convierte entidades TDLib (`textEntityTypeBold`, `textEntityTypeItalic`, `textEntityTypeCode`, `textEntityTypePre`, `textEntityTypeSpoiler`, `textEntityTypeTextUrl`, `textEntityTypeMentionUser`, etc.) a `MessageEntity*` de GramJS y las pasa como `formattingEntities`. El formato se preserva al enviar mensajes. Archivo: `src/Controllers/GramJsController.js`.
- **Recuentos reales de votos en encuestas** (`EntityTranslator.js`): `translateMessageContent` usa `media.results.results` para poblar `voter_count` y `vote_percentage` reales por opción, y marca `is_chosen`. Las encuestas muestran cuántos votos tiene cada opción. Archivo: `src/Utils/GramJs/EntityTranslator.js`.
- **Thumbnails de stickers** (`EntityTranslator.js`): `translateSticker` extrae el primer `PhotoSize` válido de `gDoc.thumbs` y lo convierte en `thumbnail` con dimensiones reales en lugar de devolver siempre `null`. Archivo: `src/Utils/GramJs/EntityTranslator.js`.

---

## [2026-05-20] (sesión 7)

### Fixed
- **Pin/unpin de chats no actualizaba la UI** — `_togglePin` llamaba a `messages.ToggleDialogPin` pero no emitía `updateChatIsPinned`. El diálogo no se movía al principio/final de la lista hasta recargar. Ahora emite el update con `order: '9223372036854775807'` cuando se fija, o con `date × 1000` cuando se desancla. Archivo: `GramJsController.js`.
- **Borrador no se mostraba en la lista de chats** — `_setChatDraftMessage` guardaba el borrador en servidor y en `_chatCache` pero no emitía `updateChatDraftMessage`. El subtítulo "Draft:" del diálogo nunca aparecía. Ahora emite el update correctamente. Archivo: `GramJsController.js`.
- **Indicadores de escritura solo enviaban "typing"** — `_sendChatAction` mapeaba solo 2 de los 13 tipos de acción (`chatActionTyping` y `chatActionUploadingDocument`). Ahora mapea los 13: grabando vídeo, subiendo foto/vídeo/documento/audio/vídeonota, eligiendo ubicación/contacto, jugando, cancelando, etc. Archivo: `GramJsController.js`.
- **Cancelar descarga bloqueaba reintento** — `_cancelDownloadFile` emitía el update de estado pero no llamaba a `this._downloadingFiles.delete(fileId)`. La siguiente llamada a `downloadFile` entraba en el guard `if (_downloadingFiles.has(fileId)) return` y quedaba bloqueada. Archivo: `GramJsController.js`.
- **`creator_user_id: 0` en grupos básicos** — `_getBasicGroupFullInfo` siempre devolvía `creator_user_id: 0` porque no buscaba el `ChatParticipantCreator` en la lista de participantes. Ahora extrae el creador correctamente. También mapea el status de cada miembro (`chatMemberStatusCreator`, `chatMemberStatusAdministrator`, `chatMemberStatusMember`) y la fecha de unión. Archivo: `GramJsController.js`.

---

## [2026-05-20] (sesión 6)

### Added
- **Instant View funcional** — los mensajes con enlaces ahora muestran el botón "Instant View" (⚡) cuando el servidor de Telegram tiene una plantilla IV para esa página. Al pulsar el botón, se abre el visor `InstantViewer` integrado sin salir de la app. El visor ya existía en el código original (con todos sus tipos de bloque) pero nunca recibía datos reales porque `getWebPageInstantView` devolvía `{}`. Archivos: `GramJsController.js`, `EntityTranslator.js`.
- **AMP Viewer in-app** — cuando un enlace no tiene Instant View de Telegram (`instant_view_version === 0`) pero la URL es HTTPS, aparece un botón ⚡ "AMP" en el preview del mensaje. Al pulsarlo se abre un visor iframe full-screen que carga la página vía **Google AMP Cache** (`cdn.ampproject.org/c/s/…`), que convierte cualquier URL AMP válida en una versión rápida y ligera. Si la página no es AMP (timeout de 8 s sin respuesta del AMP runtime), el visor muestra un fallback con botón "Abrir en navegador". Archivos nuevos: `AmpViewer.js`, `AmpViewer.css`.

### Fixed
- **Detección de Instant View** — `instant_view_version` en el objeto `webPage` ahora se calcula comprobando `wp.cachedPage` (presencia real del contenido IV en el mensaje). Antes se usaba `wp.hasLargeMedia` que es una flag de medios pesados sin relación con el IV. Archivo: `EntityTranslator.js`.
- **`description` de web page mostraba `[object Object]`** — el campo `description` se devolvía como `{ '@type': 'formattedText', ... }` pero el componente `WebPage.js` lo renderiza directamente en JSX. Corregido a string plano. Archivo: `EntityTranslator.js`.

### Implementation details
- Nuevo método `_getWebPageInstantView(req)` en `GramJsController.js` que invoca `Api.messages.GetWebPage({ url, hash: 0 })` y extrae `result.webpage.cachedPage`.
- Nuevas funciones en `EntityTranslator.js`:
  - `translateInstantView(page)` — traduce un objeto `Page` de GramJS a `webPageInstantView` de TDLib.
  - `translatePageBlock(block, photos, docs)` — mapea los 22 tipos de `PageBlock` MTProto a sus equivalentes TDLib (`pageBlockTitle`, `pageBlockParagraph`, `pageBlockPhoto`, `pageBlockVideo`, `pageBlockCollage`, `pageBlockTable`, `pageBlockDetails`, `pageBlockRelatedArticles`, `pageBlockMap`, etc.).
  - `translateRichText(rt)` — mapea los 14 tipos de `RichText` MTProto (`TextBold`, `TextItalic`, `TextUrl`, `TextConcat`, etc.) a sus equivalentes TDLib.
  - `translatePageCaption(caption)` — envuelve el texto e crédito de un caption IV.

---

## [2026-05-20] (sesión 5)

### Fixed
- **Eventos de UI tras editar/borrar mensajes** — `_editMessage` ahora emite `updateMessageContent` y `updateMessageEdited`; `_deleteMessages` emite `updateDeleteMessages`. La UI refleja los cambios en tiempo real. Archivo: `GramJsController.js`.
- **Búsqueda global de mensajes** — `_searchMessages` traducía resultados pero los descartaba; ahora construye y devuelve el array `messages` correctamente con `peerToTdlibChatId`. Archivo: `GramJsController.js`.
- **Orden de chats roto tras nuevo mensaje** — todos los `updateChatLastMessage` usaban `String(date)` (10 dígitos) en lugar de `String(date * 1000)` (13 dígitos). `orderCompare` ordena por longitud de string primero, por lo que chats con mensaje nuevo caían al fondo. Corregido en los 4 puntos de emisión. Archivos: `GramJsController.js`.
- **Badge de no leídos estático** — `DialogBadge` lee `chat.unread_count` que nunca se incrementaba para mensajes entrantes; ahora `_setupUpdateHandler` incrementa el contador y emite `updateChatReadInbox`. Archivo: `GramJsController.js`.
- **Entidades de texto perdidas en captions de medios** — todas las captions de medios tenían `entities: []` fijo; reemplazado por `makeCaption(msg)` que propaga `translateTextEntity` para negrita, cursiva, spoiler, etc. Archivo: `EntityTranslator.js`.
- **Cache de remitentes al cargar historial** — `_doFetchChatHistory` ahora llama a `_cacheUser` por cada sender y emite `updateUser`, evitando nombres en blanco al abrir un chat por primera vez. Archivo: `GramJsController.js`.
- **`updateMessageEdited` en mensajes del servidor** — cuando `_setupUpdateHandler` recibe `updateMessageContent` con `editDate` presente, emite también `updateMessageEdited` para que la UI muestre el indicador "editado". Archivo: `GramJsController.js`.
- **`updateChatReadInbox` tras marcar leído** — `_viewMessages` emite `updateChatReadInbox` con `unread_count: 0` después de la llamada MTProto, cerrando el badge de no leídos inmediatamente. Archivo: `GramJsController.js`.

### Added
- **Tipos de mensaje: nota de voz y nota de video** — `translateMessageContent` en `EntityTranslator.js` diferencia `audioAttr.voice` → `messageVoiceNote` y `videoAttr.roundMessage` → `messageVideoNote`; antes ambos se mostraban como audio/video genérico.
- **Tipos de mensaje: lugar y ubicación en vivo** — `MessageMediaVenue` → `messageVenue`; `MessageMediaGeoLive` → `messageLocation` con `live_period` y `heading`. Archivo: `EntityTranslator.js`.
- **Enviar stickers y animaciones por referencia** — `_sendFile` detecta `inputMessageSticker` e `inputMessageAnimation` y usa `Api.messages.SendMedia` + `InputMediaDocument` leyendo el hash de `mediaCache`, evitando la re-subida innecesaria. Archivo: `GramJsController.js`.
- **`updateChatLastMessage` tras cada envío** — `_sendMessage` y `_sendFile` emiten `updateChatLastMessage` justo después de `updateNewMessage` para que la lista de diálogos actualice la preview del último mensaje. Archivo: `GramJsController.js`.
- **Configuración de notificaciones del diálogo** — `translateChat` lee `dialog.notifySettings` (mute, showPreviews), `dialog.unreadMark`, `dialog.readInboxMaxId`, `dialog.readOutboxMaxId`, `dialog.unreadMentionsCount`, `dialog.pinnedMsgId` y `dialog.draft`. Archivo: `EntityTranslator.js`.
- **`getUser` emite `updateUser`** — `_getUser` llama a `_cacheEntity` y emite `updateUser` para mantener el `UserStore` actualizado. Archivo: `GramJsController.js`.
- **`getUserFullInfo` retorna comandos de bot y `has_private_forwards`** — extrae `botInfo.commands`, actualiza el `User` embebido en `UserStore` y devuelve `has_private_forwards`. Archivo: `GramJsController.js`.
- **Indicadores de escritura completos** — nuevo helper `translateTypingAction(action)` en `UpdateTranslator.js` mapea los 13 tipos MTProto (`SendMessageTypingAction`, `SendMessageRecordVideoAction`, `SendMessageUploadPhotoAction`, etc.) a sus equivalentes TDLib en lugar de devolver siempre `chatActionTyping`.

---

## [2026-05-20] (sesión 4)

### Added
- **MediaViewer mejorado** — botón de Picture-in-Picture para vídeos, velocidad de reproducción cíclica (0.5×→1×→1.5×→2×). Archivos: `MediaViewer.js`, `MediaViewerContent.js`.
- **"Mostrar en chat" para mensajes reenviados** — opción en menú contextual de mensajes reenviados desde canales que navega al chat/mensaje original. Archivos: `Message.js`, `LocalizationStore.js`.
- **Búsqueda por remitente** — prefijo `from:username` en el buscador de un chat filtra mensajes del usuario. Resuelve el usuario con `searchPublicChat`. Archivos: `Search.js`, `GramJsController.js`.
- **Filtros aplicados en GramJS** — `searchChatMessages` ahora pasa el filtro de tipo y `fromId` real a `messages.Search`. Archivo: `GramJsController.js`.
- **Override móvil** — botón "Continue in browser" en la pantalla de NativeAppControl evita el bloqueo del cliente en móvil. Archivos: `NativeAppControl.js`, `TelegramApp.js`.
- **Panel de sesiones activas** — menú ≡ → "Active Sessions" abre un diálogo listando todos los dispositivos conectados con opción de cerrar sesiones individuales o todas a la vez. Archivos: `ActiveSessions.js`, `GramJsController.js`, `MainMenuButton.js`.
- **Herramientas de administrador** — botones Kick/Ban en la lista de miembros del grupo cuando el usuario es administrador. Archivos: `ChatDetails.js`, `GramJsController.js`, `Utils/Chat.js`.
- **Edición de descripción inline** — los administradores pueden editar la descripción del grupo/canal directamente en el panel de detalles con un campo de texto inline. Archivos: `ChatDetails.js`, `GramJsController.js`.
- **Read receipts con checkmarks** — ✓ enviado, ✓✓ leído, ! fallido en los mensajes enviados propios. Archivos: `MessageStatus.js`, `MessageStatus.css`.
- **Ctrl+K abre búsqueda global** — atajo de teclado `Ctrl+K` / `Cmd+K` abre el buscador global de chats. Archivo: `TelegramApp.js`.
- **Badge de no leídos en ScrollDownButton** — el botón de bajar al final muestra el contador de mensajes no leídos abajo. Archivos: `ScrollDownButton.js`, `MessagesList.js`.
- **"Leave/Delete" en menú de chats** — clic derecho en un chat → "Leave / Delete" lo abandona. Archivos: `Dialog.js`, `GramJsController.js`.
- **Notificaciones de escritorio** — solicita permiso al inicio y muestra notificaciones del sistema para mensajes entrantes cuando la ventana no está enfocada. Archivo: `Utils/NotificationManager.js`.

---

## [2026-05-20] (sesión 3)

### Added
- **Info de archivo en el visor** — el subtítulo del MediaViewer muestra "N of M · 1.2 MB · 15 may 2026". Archivos: `MediaViewer.js`.
- **Copiar imagen al portapapeles** — botón en el footer del visor (FileCopy icon) que copia el blob de la imagen via `navigator.clipboard.write()`. Archivos: `MediaViewer.js`.
- **Login por código QR** — botón "Log in by QR Code" en la pantalla del teléfono; genera el token via `auth.ExportLoginToken` y lo muestra en un canvas QR con polling automático. Archivos: `QrCode.js`, `QrCode.css`, `GramJsController.js`, `AuthFormControl.js`, `TelegramApp.js`, `Phone.js`.
- Instalado `qrcode@1.5.4` para renderizar el QR en canvas.

---

## [Unreleased] — 2026-05-20 (sesión 2)

### Added
- **Tipos de mensaje nuevos** — `messageStory` (📖 historia reenviada), `messageGiveaway` (🎁), `messageGiveawayWinners` (🎉) y `messageProximityAlertTriggered` (📍) ahora se renderizan con tarjeta visual en lugar de `[tipo]`. Archivos: `Utils/Message.js`, `Message.css`.
- **Enviar sin notificación** — botón 🔔/🔕 en la barra de entrada. Cuando está activo (rojo), el mensaje se envía con `silent: true` vía MTProto. `GramJsController._sendMessage` acepta `disable_notification`. Archivos: `InputBoxControl.js`, `GramJsController.js`.
- **Bloquear usuario** — opción "Block User" en el menú contextual de mensajes entrantes de usuarios privados. Implementado con `contacts.Block`. Archivos: `GramJsController.js`, `Message.js`, `LocalizationStore.js`.
- **Enlace al mensaje** — opción "Copy Link" en el menú contextual de mensajes. Para canales usa `channels.ExportMessageLink` y copia al portapapeles. Archivos: `GramJsController.js`, `Message.js`.
- **Cancelar descarga** — `cancelDownloadFile` ahora emite `updateFile` limpiando el estado de descarga en la UI. Archivo: `GramJsController.js`.
- **Filtros de búsqueda por tipo** — al buscar dentro de un chat aparecen tabs: All / Photos / Videos / Files / Links / Audio. Cada tab pasa el filtro `searchMessagesFilter*` a `searchChatMessages`. Archivos: `Search.js`, `Search.css`.

---

## [2026-05-20] (sesión 1)

### Added
- **Silenciar/activar notificaciones de chat** — `setChatNotificationSettings` ahora llama a `account.UpdateNotifySettings` de GramJS. Emite `updateChatNotificationSettings` para reflejar el cambio localmente de forma inmediata. Archivo: `GramJsController.js`.
- **Marcar chat como no leído** — `toggleChatIsMarkedAsUnread` llama a `messages.MarkDialogUnread` y emite `updateChatIsMarkedAsUnread`. Archivo: `GramJsController.js`.
- **Leer todas las menciones** — `readAllChatMentions` llama a `messages.ReadMentions`. Archivo: `GramJsController.js`.
- **Reportar mensajes** — nuevo método `reportChat` que mapea los motivos TDLib a `InputReportReason*` de MTProto. Nueva opción "Report" en el menú contextual de mensajes entrantes. Archivos: `GramJsController.js`, `Message.js`.
- **Dados animados** (`messageDice`) — nuevo componente `Dice.js` que muestra el emoji del dado con la cara correspondiente al valor (🎲 → ⚀‒⚅) y animación CSS de aterrizaje. Archivos: `Dice.js`, `Dice.css`, `Utils/Message.js`.
- **Facturas / pagos** (`messageInvoice`) — nuevo componente `Invoice.js` que muestra título, descripción, precio formateado con `Intl.NumberFormat` y badge TEST. Archivos: `Invoice.js`, `Invoice.css`, `Utils/Message.js`.
- **Botón "Ir a no leídos"** — `JumpToUnreadButton` flotante con contador de mensajes no leídos. Aparece encima del botón de bajar al final cuando hay un separador de no leídos y el usuario está scrolleado arriba. Archivos: `JumpToUnreadButton.js`, `JumpToUnreadButton.css`, `MessagesList.js`.
- **Botón dedicado de Stickers en InputBox** — icono `TagFaces` junto al emoji que abre el picker directamente en la pestaña de stickers mediante el evento `clientUpdateOpenStickersPanel`. `EmojiPickerButton` escucha ese evento y activa la pestaña automáticamente. Archivos: `InputBoxControl.js`, `EmojiPickerButton.js`.

---

## [2026-05-19]

### Added
- **Spoiler de texto** (`textEntityTypeSpoiler`) — el texto aparece borroso y se revela al hacer clic. Implementado en `Utils/Message.js` con CSS en `Message.css`.
- **Subrayado y tachado** — soporte para `textEntityTypeUnderline` (`<u>`) y `textEntityTypeStrikethrough` (`<s>`) en el renderizado de mensajes.
- **Encuestas tipo Quiz** — las encuestas con `pollTypeQuiz` muestran subtítulo "Quiz", marcan la respuesta correcta con ✓ (verde) y la incorrecta con ✗ (rojo). Se muestra la explicación debajo de las opciones al votar o cuando la encuesta cierra.
- **Spoiler de medios** — las fotos con `has_spoiler: true` se muestran con blur y un ícono de ojo; hacer clic las revela sin cerrar la vista. Implementado en `Photo.js` y `Photo.css`.
- **Múltiples mensajes fijados** — se cargan todos los pins con `searchChatMessages` + `searchMessagesFilterPinned`. Navegación entre ellos con barras indicadoras (hasta 4) y etiqueta "Pinned Message N of M". Degradación elegante en TDLib antiguo. Ahora `unpinChatMessage` recibe el `message_id` correcto.
- **Traducción de mensajes** — nueva opción "Translate message" en el menú contextual de cualquier mensaje con texto. Llama a la API `translateText` de TDLib y muestra el resultado en línea debajo del mensaje con indicador de carga.
- **Chats secretos** — soporte completo de UI: ícono de candado en lista de diálogos y cabecera, subtítulo de espera de clave, botón "Start Secret Chat" en detalles de contacto, suscripción a `updateSecretChat`.

### Fixed
- Badge de no leídos en Archivo ahora muestra el contador real en tiempo real (desde `ChatStore.counters`).
- Tres TODOs implementados en `ChatStore`: `updateChatDefaultDisableNotification`, `updateSecretChat`, `updateUnreadChatCount`.

---

## [Historial anterior]

### Fixed
- Reemplazado paquete `@arseny30/tdweb@1.5.9` (eliminado de npm) por `tdweb@1.6.0` original
- Eliminado `package-lock.json` que bloqueaba `es-abstract@1.14.0` (ya no existe en npm)
- Compatibilidad con Node.js 17+: agregado `NODE_OPTIONS=--openssl-legacy-provider` para webpack 4 (error `ERR_OSSL_EVP_UNSUPPORTED`)
- Ruta de importación de `createSvgIcon` en los 13 iconos SVG personalizados: `@material-ui/core/esm/internal/svg-icons/createSvgIcon` → `@material-ui/core/esm/utils/createSvgIcon` (cambio en MUI v4.12)
- Importación de `createMuiTheme` en `Theme.js`: de ruta directa `@material-ui/core/styles/createMuiTheme` → `import { createMuiTheme } from '@material-ui/core/styles'` (cambio en MUI v4.12)
- Selector de país sin resultados: fetch de `countries.dat` ahora usa `process.env.PUBLIC_URL` para resolver correctamente la ruta en dev y producción
- TDLib nunca inicializaba (teléfono sin respuesta): los web workers de TDLib se cargaban desde `/telegram-react/worker.js` pero `public/` se sirve desde `/`. Solución: `.env.development` con `PUBLIC_URL=/` para que publicPath sea la raíz en desarrollo
- **Actualización a `tdweb@1.8.0`** (TDLib 1.8): WASM y workers actualizados en `public/` (hash `3dee0f934ca1a5946a253599e3e442c6`)
- `setTdlibParameters`: corregido formato — tdweb@1.8.0 sigue esperando el objeto `parameters` anidado (el worker accede a `query.parameters.database_directory`); enviar parámetros planos causaba `TypeError` → `updateFatalError`
- `authorizationStateWaitEncryptionKey`: restaurado `checkDatabaseEncryptionKey` con clave vacía (TDLib 1.8 sigue enviando este estado; aún hay que responderle con key vacía para avanzar)

### Migración tdweb → GramJS (layer actual)
- Instalado `telegram@2.26.21` (GramJS) — MTProto puro en JS con layer 158+
- Creado `src/Controllers/GramJsController.js` — reemplaza la lógica de TDLib/WASM manteniendo la misma interfaz de eventos (`send`, `clientUpdate`, `emit('update')`, `emit('clientUpdate')`)
- Robustecido el flujo de migración de DC en `GramJsController` para números de teléfono de regiones no locales (por ejemplo, DC1 de EE. UU. `PHONE_MIGRATE_1`):
  - Añadido bucle de 5 intentos de conexión WSS con retardo de estabilización y backoff exponencial para evitar caídas de WebSocket instantáneas en el navegador.
  - Asegurada la reinstanciación y reconexión de manejadores de eventos raw (`_setupUpdateHandler`) tras recrear el cliente en el nuevo DC de destino.
  - Desactivado IPv6 (`useIPV6: false`) y forzado modo producción (`testMode: false`) en opciones del cliente para máxima estabilidad en navegadores.
- Corregida pantalla en blanco (TypeError en `LanguagePicker.js`) tras iniciar sesión con éxito:
  - Implementado el método `getLocalizationTargetInfo` en `GramJsController.js` para que retorne los paquetes de idiomas inglés y español conformes al esquema de TDLib.
  - Securizado el método de renderizado en `LanguagePicker.js` agregando fallbacks seguros en caso de que las propiedades del store de localización no estén inicializadas.
- Solucionado el problema de la lista de chats y mensajes vacía en el panel izquierdo al iniciar la app:
  - Creado un mecanismo de sincronización asíncrona mediante `_initialDialogsPromise` en el constructor de `GramJsController.js`.
  - Modificado el método `_getChats` para suspender la respuesta de forma segura hasta que la primera tanda de diálogos de GramJS se haya descargado y cacheado por completo, garantizando que el listado nunca retorne vacío por retraso de red.
  - Corregido el bug de offsets de GramJS: Cambiado el comportamiento por defecto de `offsetDate` y `offsetId` en `_loadDialogs()` a `undefined` para evitar que el entero `0` filtrara de manera estricta y restrictiva todos los diálogos activos en el servidor de Telegram.
- Implementación de Traductores Multimedia en `EntityTranslator.js` (Multimedia Gap):
  - Añadidos traductores robustos (`translatePhoto`, `translateVideo`, `translateAnimation`, `translateAudio`, `translateDocument`, `translateSticker`) para mapear los objetos multimedia de GramJS a esquemas compatibles de TDLib.
  - Solucionados crashes fatales en la interfaz de React (`TypeError: Cannot read properties of null (reading 'sizes' / 'minithumbnail')` en `Photo.js` y `Animation.js`) causados por los anteriores placeholders `null`.
- Corrección del fallo de sincronización y reconciliación de React (`removeChild` Crash):
  - Restaurada la mutación en sitio mediante `Object.assign(source1, source2)` en `ChatStore.assign` dentro de `ChatStore.js` para mantener en perfecta sincronía todas las referencias a los objetos `chat` en los componentes.
  - Actualizado `shouldComponentUpdate()` en `Dialog.js` y `DialogContent.js` para retornar `true`, asegurando que las actualizaciones de mensajes y acciones en tiempo real (`updateChatLastMessage`, `updateUserChatAction`) no causen discrepancias en el Virtual DOM de React.
- Creado `src/Utils/GramJs/EntityTranslator.js` — traduce entidades GramJS (User, Chat, Channel, Message) al formato TDLib que esperan los stores
- Creado `src/Utils/GramJs/UpdateTranslator.js` — traduce raw MTProto updates al formato `updateXxx` de TDLib
- `src/Controllers/TdLibController.js` ahora re-exporta `GramJsController` — todos los imports existentes siguen funcionando
- `ApplicationStore`: eliminados `sendTdParameters` y `checkDatabaseEncryptionKey` (GramJsController gestiona el flujo de auth internamente)
- Eliminada la dependencia de `tdweb` en el flujo principal (sigue en `package.json` hasta confirmar migración completa)
- Suprimido aviso "app desactualizada" de `updateServiceNotification` (sustituido por `console.warn`)

### Novedades (sesión 2026-05-19 — multicuenta)
- **Soporte multicuenta** — permite alternar entre varias sesiones de Telegram sin cerrar sesión:
  - `GramJsController`: cada cuenta tiene su propia clave de sesión (`tg_gramjs_session_0`, `_1`, …); se migra automáticamente la sesión legacy.
  - `_accounts` (array en localStorage `tg_gramjs_accounts`) guarda `{index, sessionKey, userId, name, phone}` de cada cuenta logueada.
  - `addAccount()` crea una nueva ranura y lanza el flujo de auth vacío (número de teléfono → código).
  - `switchAccount(index)` desconecta el cliente actual, limpia caches, y reutiliza el flujo `authorizationStateClosed → init()` para reconectar con la sesión de la cuenta destino.
  - `removeAccount(index)` borra la sesión de localStorage y cambia a la siguiente cuenta disponible (o hace logout completo si no queda ninguna).
  - `_saveAccountInfo(me)` actualiza nombre y teléfono en el registro de cuenta tras cada login.
  - `MainMenuButton`: botón "Add Account" en el menú de hamburguesa; aparece un ítem "Switch to [nombre]" por cada cuenta adicional logueada.

### Novedades (sesión 2026-05-19 — stickers animados)
- **Stickers animados TGS** — los stickers Lottie/TGS ahora se reproducen en el chat:
  - `EntityTranslator.translateSticker`: detecta mime `application/x-tgsticker` y asigna `is_animated: true`; propaga `set_id` desde `DocumentAttributeSticker.stickerset.id`.
  - El componente `Sticker.js` ya usaba `is_animated` para decidir si inflar el blob gzip con `pako` y renderizar `<Lottie>` — el flag faltante era el único bloqueo.
- **Picker de stickers funcional** — el selector de stickers ahora carga los packs instalados del usuario:
  - Implementado `_getInstalledStickerSets` via `messages.GetAllStickers` — almacena `accessHash` de cada pack en `_stickerSetAccessHashes`.
  - Implementado `_getStickerSet` via `messages.GetStickerSet` — devuelve el set completo con documentos, mapeando emojis desde `StickerPack.documents`.
  - Implementado `_getRecentStickers` via `messages.GetRecentStickers`.
  - Añadidos `translateStickerSetInfo` y `translateStickerSet` en `EntityTranslator.js` para convertir respuestas GramJS al formato TDLib que usan `StickerSet.js` y `StickersPicker.js`.

### Novedades (sesión 2026-05-19)
- **Carpetas de chats (Chat Folders)** — el sidebar muestra una barra de tabs horizontal con todas las carpetas definidas en Telegram (obtenidas via `messages.GetDialogFilters`). Al pulsar una carpeta, la lista de chats filtra solo los chats incluidos en ella (`include_peers` + `pinned_peers`). La vista "All" restaura el comportamiento normal. Los tabs solo se muestran si el usuario tiene al menos una carpeta configurada.
  - `GramJsController`: nuevo `_loadDialogFilters()`, `_inputPeerToTdlibChatId()`, `_folderChats` (Map folderId→Set\<chatId\>). `_getChats` extendido para `chatListFilter`.
  - Nuevo componente `src/Components/ColumnLeft/FolderDialogsList.js`: carga y renderiza los chats de una carpeta.
  - `Dialogs.js`: barra de tabs, estado `chatFilters`/`activeFilter`, suscripción a `clientUpdateChatFilters`.
  - `Dialogs.css`: estilos de tabs y lista de carpeta.
  - **Fix:** `filter.title` en GramJS v2 es un objeto `TextWithEntities`, no un string plano — ahora se extrae `.text` antes de pasarlo a React.
- **Persistencia de mensajes offline (cache-first)** — nuevo `src/Utils/MessageCache.js` que guarda los últimos 50 mensajes por chat en IndexedDB (`idb-keyval`). Al abrir un chat, los mensajes aparecen instantáneamente desde el caché y se actualiza en segundo plano (`_refreshMessagesInBackground`): los mensajes nuevos llegan vía `updateNewMessage` sin recargar todo el historial.
- Los mensajes en caché se borran automáticamente al cerrar sesión (manejado en `CacheStore.onUpdate` → `authorizationStateLoggingOut`).
- `CacheStore` expone `loadMessages`, `saveMessages`, `clearAllMessageCaches` delegando a `MessageCache.js` para evitar dependencias circulares con `GramJsController`.

### Novedades (sesión 2025-05-18)
- **Copiar texto del mensaje** — nuevo ítem "Copy" en el menú contextual de mensajes; copia el texto o caption al portapapeles con `navigator.clipboard.writeText` (`Message.js`)
- **Nota de voz** — botón de micrófono en la barra de entrada (rojo cuando graba); usa `MediaRecorder` con `audio/webm;codecs=opus`; al detener envía automáticamente como `inputMessageVoiceNote` (`InputBoxControl.js`)
- **Envío de archivos y fotos vía GramJS** — `_sendMessage` en `GramJsController` ahora detecta `inputMessageDocument`, `inputMessageVoiceNote`, `inputMessageAudio` e `inputMessagePhoto` y los enruta a `_sendFile` que usa `client.sendFile()` con los atributos MTProto correctos

### Correcciones recientes (sesión 2025-05-18)
- `DialogsList`: guard `_isMounted` en todos los `setState` y `forceUpdate` para evitar actualizaciones en componentes desmontados
- `DialogContent`: guard `_isMounted` en todos los `forceUpdate`
- `GramJsController`: `_emitUpdate` y `clientUpdate` envueltos en `unstable_batchedUpdates` — corrige el crash `removeChild` causado por múltiples `forceUpdate` síncronos disparados desde el EventEmitter fuera del contexto de React
- `UpdateTranslator`: `updateUserChatAction` ahora incluye `user_id` a nivel raíz para compatibilidad con `ChatStore` (que lee el formato TDLib v3/v4)
- `GramJsController`: implementados `_downloadFile`, `_emitUpdateFile` y `_readFile` para descarga y lectura de archivos multimedia vía GramJS (`InputPhotoFileLocation` / `InputDocumentFileLocation`)
- `public/index.html`: polyfill `window.process` para contextos eval/worker de GramJS (`path-browserify`)

### Mejoras pendientes — Auditoría 2026-05-20

Resultado de auditoría exhaustiva del código. Organizado por prioridad real de impacto en el usuario.

---

#### Prioridad CRÍTICA — Funciones rotas que impactan el uso diario

- **Silenciar/activar notificaciones de chat** — `setChatNotificationSettings` en `GramJsController.js` retorna `{}` vacío sin hacer nada. Archivo: `src/Controllers/GramJsController.js` ~línea 628.
- **Marcar chat como no leído** — `toggleChatIsMarkedAsUnread` retorna `{}` vacío. Archivo: `src/Controllers/GramJsController.js` ~línea 630.
- **Leer todas las menciones** — `readAllChatMentions` retorna `{}` vacío. Archivo: `src/Controllers/GramJsController.js` ~línea 614.
- **Login por código QR** — `requestQrCodeAuthentication` retorna `{}` sin implementación. Archivo: `src/Controllers/GramJsController.js` ~línea 567.

---

#### Prioridad ALTA — Features esenciales de un cliente moderno

**Caja de entrada (InputBoxControl):**
- **Botón de stickers visible** — el picker existe (`StickersPicker`) pero no hay un botón en el render que lo abra. Solo se activa via `onClientUpdateStickerSend` sin punto de entrada en la UI.
- **Enviar sin notificación** — no hay checkbox/opción "Send without sound" al enviar mensajes.
- **Mensajes con autodestrucción (TTL)** — no hay UI para seleccionar temporizador de autodestrucción al enviar fotos/vídeos en chats secretos.

**Menú contextual de mensajes (Message.js):**
- **Reportar mensaje** — no existe opción "Report" en el menú contextual.
- **"Ver en el chat"** para mensajes reenviados — no implementado.
- **Agregar reacción desde menú** — solo existe `Reactions.js` en el cuerpo del mensaje, no accesible desde el menú contextual.

**Lista de mensajes (MessagesList.js):**
- **Botón "Ir al primer no leído"** — existe `separatorMessageId` y `UnreadSeparator` pero no hay botón flotante para saltar al separador de no leídos.
- **Botón "Bajar al final"** (`ScrollDownButton`) — existe el componente importado pero verificar si se renderiza correctamente en todos los casos.

**Búsqueda (ColumnLeft):**
- **Filtros de búsqueda por tipo** — no hay tabs "Fotos / Vídeos / Documentos / Links / Audio" en los resultados de búsqueda.
- **Búsqueda por fecha** — no hay selector de rango de fechas.
- **Búsqueda por remitente** — no hay opción `from:usuario`.

---

#### Prioridad ALTA — Tipos de mensajes no renderizados

Los siguientes tipos de `content` de TDLib no tienen componente en `src/Components/Message/Media/` y se muestran en blanco o se ignoran:

- **`messageDice`** — dados/dados animados (emojis interactivos como 🎲🎯🏀). Muy usados.
- **`messageInvoice`** — pagos y facturas de bots de tienda.
- **`messageStory`** — historias reenviadas (Telegram 7.4+).
- **`messageGiveaway`** / **`messageGiveawayWinners`** — sorteos de Telegram Premium.
- **`messagePassportData`** — datos de Telegram Passport.
- **`messageProximityAlertTriggered`** — alerta de proximidad en grupos con ubicación en vivo.

---

#### Prioridad MEDIA — Mejoras de UX relevantes

**Visor de medios (Viewer):**
- **Información del archivo** — no muestra tamaño, fecha ni fuente del archivo en el visor.
- **Navegación por teclado** — las teclas ← → no navegan entre fotos del álbum en el visor.
- **Control de velocidad en vídeos** — no hay selector 0.5×, 1×, 1.5×, 2×.
- **"Copiar imagen"** al portapapeles — solo existe descarga, no copia directa.
- **Picture-in-Picture** — no hay soporte PiP para vídeos.

**Panel derecho (ChatDetails / ColumnRight):**
- **Múltiples fotos de perfil** — solo muestra la foto actual, no el historial de fotos de perfil.
- **Herramientas de administrador** — no hay UI para expulsar, silenciar o banear miembros.
- **Invitaciones pendientes** — no hay vista de solicitudes de unión (`join requests`).
- **Edición de descripción de canal/grupo** — no hay formulario de edición inline.
- **Estadísticas de canal** — no hay pestaña de estadísticas para canales.

**Información/acciones de chat:**
- **"Bloquear usuario"** — no exportado en `Actions/Client.js`, no hay botón en la UI de perfil.
- **"Obtener enlace al mensaje"** — no existe `getMessageLink` en `Actions/Client.js`.
- **Reenvío de mensajes programados** — no hay UI para ver y gestionar mensajes programados existentes.

---

#### Prioridad BAJA — Funciones avanzadas / futuro

- **Topics en supergrupos** — soporte de `message_thread_id` en historial, envío y UI de hilos.
- **Llamadas y videollamadas WebRTC** — `Call.js` solo muestra información estática; no hay flujo VoIP real.
- **Web Apps (bots)** — `messageWebAppDataReceived` no implementado; no se pueden abrir Mini Apps de Telegram desde mensajes de bot.
- **Grupos de notificaciones** — `setNotificationGroup` / `removeNotification` retornan `{}` en el controlador.
- **Cancelación de descarga** — `cancelDownloadFile` retorna `{}`; no se puede cancelar una descarga en curso.
- **Modo responsive / móvil** — `NativeAppControl.js` muestra "Work is in progress" en pantallas pequeñas.
- **Autenticación en dos pasos visual** — no hay UI para configurar/cambiar la contraseña 2FA desde la app.
- **Gestión de sesiones activas** — no hay panel para ver y cerrar otras sesiones de Telegram.

---

#### Deuda técnica interna

- **`GramJsController._dispatch`**: ~20 casos retornan `{}` vacío sin implementación. Los más críticos están marcados arriba.
- **`SharedMediaBase.js`**: 3 métodos virtuales lanzan `Error` si no se sobreescriben; documentar qué subclases deben implementarlos.
- **`NativeAppControl.js`**: texto "Work is in progress" visible para usuarios móviles — reemplazar por diseño responsive real.
- **Bloques `catch {}`** silenciosos en `AuthorizationStore`, `ChatStore`, `MessageCache`, `GramJsController` (8 casos) — añadir logging mínimo para facilitar depuración.
- **Código comentado** en `CacheManager.js`, `Theme.js`, `MessagesList.js` — revisar si debe eliminarse o reactivarse.

---

#### Ya implementado ✅ (referencia)

| Feature | Estado |
|---|---|
| Nota de voz (grabación + envío) | ✅ |
| Reacciones a mensajes | ✅ |
| Copiar texto del mensaje | ✅ |
| Mensajes programados | ✅ |
| Spoiler de texto | ✅ |
| Spoiler de medios (fotos) | ✅ |
| Encuestas tipo Quiz | ✅ |
| Múltiples mensajes fijados | ✅ |
| Traducción de mensajes | ✅ |
| Chats secretos (UI) | ✅ |
| Multicuenta | ✅ |
| Stickers animados TGS | ✅ |
| Carpetas de chats | ✅ |
| Caché offline de mensajes | ✅ |
| Crear grupos y canales | ✅ |
| Diseños de tema (Android, macOS, TDesktop…) | ✅ |
| messageStory / messageGiveaway / messageGiveawayWinners | ✅ |
| Enviar sin notificación (modo silencioso) | ✅ |
| Bloquear usuario desde menú contextual | ✅ |
| Enlace al mensaje (Copy Link) | ✅ |
| Cancelar descarga | ✅ |
| Filtros de búsqueda por tipo (fotos, vídeos, docs…) | ✅ |
| Nota de video (mensajes redondos) | ✅ |
| Lugar (messageVenue) y ubicación en vivo | ✅ |
| Enviar stickers/animaciones por referencia (sin re-subida) | ✅ |
| Indicadores de escritura completos (13 tipos de acción) | ✅ |
| Badge de no leídos en tiempo real | ✅ |
| Entidades de texto en captions de medios | ✅ |
| Configuración de notificaciones del diálogo (mute, draft, read markers) | ✅ |
| Instant View / AMP para mensajes con enlaces | ✅ |

---

*Las entradas anteriores al fork de ComunidadTelebots están en el historial de git del upstream: https://github.com/evgeny-nadymov/telegram-react*
