# Changelog

## [Unreleased]

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

### Roadmap de Brechas con Telegram Android (Planificado)

#### Alta prioridad
- ~~**Nota de voz**~~ ✅ implementado — grabación con `MediaRecorder` (webm/opus), botón en InputBoxControl, envío vía `GramJS sendFile`
- ~~**Reacciones a mensajes**~~ ✅ implementado — `Reactions.js` renderiza burbujas de emoji con contador; picker rápido (6 emojis) al pulsar "+"; toggle para añadir/quitar; `messages.SendReaction` vía GramJS; `updateMessageReactions` en UpdateTranslator, MessageStore y EntityTranslator

#### Prioridad media
- ~~**Copiar texto del mensaje**~~ ✅ implementado — ítem "Copy" en menú contextual con `navigator.clipboard.writeText`
- ~~**Mensajes programados**~~ ✅ implementado — botón de reloj (⏰) en InputBoxControl abre un dialog con `datetime-local`; `schedule_date` (Unix timestamp) se pasa a `_sendMessage` y `_sendFile` en GramJsController vía `scheduleDate` de GramJS
- **Crear grupos y canales desde la UI** — diálogo de creación conectado a `channels.CreateChannel` / `messages.CreateChat`
- **Persistencia offline (IndexedDB)** — capa de caché con `localForage` para evitar descargas completas del servidor tras cada refresco

#### Prioridad baja
- **Topics en supergrupos** — soporte de `message_thread_id` en historial y envío
- **Carpetas de chats** (chat filters) — `DialogFilter` de MTProto, panel de gestión en el sidebar
- **Stickers animados (TGS)** — reproductor Lottie/WASM para stickers y reacciones animadas
- **Soporte multicuenta** — arquitectura para alternar sesiones activas de distintos números
- **Llamadas y videollamadas WebRTC** — flujos VoIP/audio/video para llamadas de grupo

#### Planificado anteriormente
- **Persistencia de Base de Datos Offline (IndexedDB):** Implementación de una capa de base de datos persistente en el navegador utilizando `localForage` / `IndexedDB` para evitar descargas completas del servidor tras cada refresco de la página.
- **Gestión Completa de Descargas / Subidas de Archivos:** Integrar `client.downloadMedia()` de GramJS para procesar descargas progresivas y de gran tamaño con barra de progreso interactiva en lugar de no-ops.
- **Stickers Animados (TGS) y Reacciones Dinámicas:** Integración de un reproductor vectorial en WebAssembly (Lottie/TGS) para soportar stickers en movimiento y animaciones enriquecidas de reacciones a mensajes.
- **Soporte Multicuenta:** Arquitectura para alternar y controlar múltiples sesiones activas asociadas a diferentes números telefónicos en caliente.
- **Llamadas y Videollamadas WebRTC:** Mapear flujos de VoIP y audio/video en tiempo real para emular llamadas de grupo.

---

*Las entradas anteriores al fork de ComunidadTelebots están en el historial de git del upstream: https://github.com/evgeny-nadymov/telegram-react*
