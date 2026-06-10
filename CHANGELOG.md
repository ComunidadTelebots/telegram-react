# Changelog

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
