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
- Creado `src/Utils/GramJs/EntityTranslator.js` — traduce entidades GramJS (User, Chat, Channel, Message) al formato TDLib que esperan los stores
- Creado `src/Utils/GramJs/UpdateTranslator.js` — traduce raw MTProto updates al formato `updateXxx` de TDLib
- `src/Controllers/TdLibController.js` ahora re-exporta `GramJsController` — todos los imports existentes siguen funcionando
- `ApplicationStore`: eliminados `sendTdParameters` y `checkDatabaseEncryptionKey` (GramJsController gestiona el flujo de auth internamente)
- Eliminada la dependencia de `tdweb` en el flujo principal (sigue en `package.json` hasta confirmar migración completa)
- Suprimido aviso "app desactualizada" de `updateServiceNotification` (sustituido por `console.warn`)

---

*Las entradas anteriores al fork de ComunidadTelebots están en el historial de git del upstream: https://github.com/evgeny-nadymov/telegram-react*
