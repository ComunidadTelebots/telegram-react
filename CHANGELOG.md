# Changelog

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

