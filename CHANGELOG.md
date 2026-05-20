# Changelog

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

---

*Las entradas anteriores al fork de ComunidadTelebots están en el historial de git del upstream: https://github.com/evgeny-nadymov/telegram-react*
