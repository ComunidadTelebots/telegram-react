# Telegram Web — ComunidadTelebots fork

Cliente web de Telegram en React + [GramJS](https://github.com/gram-js/gramjs), fork de [evgeny-nadymov/telegram-react](https://github.com/evgeny-nadymov/telegram-react).

**Demo:** [tg.todosobreall.tech](https://tg.todosobreall.tech)

> ⚠️ **Experimental.** No es un cliente oficial. Para uso diario, [telegram.org/apps](https://telegram.org/apps).

## Tabla de contenidos
- [Por qué este fork](#por-qué-este-fork)
- [Qué añade](#qué-añade)
- [Estado de funcionalidades](#estado-de-funcionalidades)
- [Arquitectura](#arquitectura)
- [Despliegue local](#despliegue-local)
- [Despliegue en producción](#despliegue-en-producción)
- [Contribuir](#contribuir)
- [Seguridad](#seguridad)
- [Hoja de ruta](#hoja-de-ruta)
- [Créditos y licencia](#créditos-y-licencia)

## Por qué este fork

El upstream de evgeny-nadymov estaba congelado en la capa 127 de MTProto y faltaban features de Telegram modernas (encuestas con formato, blockquote, Instant View con caché, fixes de llamadas). Este fork pone al día el cliente sobre **capa 198** con GramJS 2.26.x, sin perder compatibilidad con la base original.

Objetivo principal: tener un cliente web autoalojable, auditable y centrado en privacidad — sin telemetría, sin tracking de terceros, sirviendo desde tu propia infraestructura.

## Qué añade

### Protocolo (capa 198)
- **Blockquote** (`messageEntityBlockquote`, soporte de `collapsed`).
- **Encuestas enriquecidas** (`PollAnswer` con `text_entities`).
- **Instant View con caché** ("really instant" de Telegram 6.9.0): el `wp.cachedPage` se cachea al traducir `MessageMediaWebPage`; `_getWebPageInstantView` sirve desde caché antes de pedir red.
- **Envío de voto** (`messages.SendVote`) y cierre de encuestas (`stopPoll`).
- **Sesiones activas** (Devices): `account.GetAuthorizations`, `ResetAuthorization`, `ResetAuthorizations`.

### Llamadas de voz (WebRTC 1-a-1, parcial)

Tres fixes críticos sobre el flujo:
| Fix | Archivo | Descripción |
|---|---|---|
| ICE candidates pendientes | `CallController.js:_tryBuildRemoteSdp` | Antes se descartaban tras `setRemoteDescription`. Ahora se añaden con `splice(0)` + try/catch por candidato. |
| g_a_hash anti-MITM | `CallController.js:_onCallConfirmed` | Verificación SHA-256 del `g_a` recibido vs `g_a_hash` almacenado. Aborta con `phone.DiscardCall` si no coincide. |
| Timeout signaling queue | `CallController.js` | Timer de 10s si `_authKey` no llega; vacía cola y limpia. |

Pendiente: race condition del DH en `requestCall`, fallback ICE con TURN real (hoy solo STUN de Google → ~30% no conecta tras NAT simétrico), vídeo y group calls.

### Interfaz
- **8 skins** de tema con estilos por skin.
- **Búsqueda de chats** funcional (`getTopChats`, `searchChats`, `addRecentlyFoundChat`).
- **Tutorial de onboarding** de 8 pasos (`TutorialDialog.js`), persistente en localStorage.
- Hotkey **Escape** para cerrar diálogos.
- **CHANGELOG** por sesión de desarrollo en `CHANGELOG.md`.

## Estado de funcionalidades

| Función | Estado | Notas |
|---|---|---|
| Login (teléfono + 2FA) | ✅ | |
| Mensajes de texto | ✅ | |
| Búsqueda de chats | ✅ | |
| Encuestas (votar + cerrar) | ✅ | |
| Blockquote | ✅ | Soporta `collapsed` |
| Instant View con caché | ✅ | AMP no se beneficia (iframe externo) |
| Sesiones activas | ✅ | |
| Llamadas de voz 1-a-1 | ⚠️ Parcial | Conecta si ambos extremos tienen ruta directa o STUN basta; falla tras NAT simétrico |
| Videollamadas | ❌ | Código existe, no verificado |
| Llamadas grupales | ❌ | No soportado |
| Editar perfil | ❌ | `account.UpdateProfile/UpdateUsername` pendiente |
| Mensajes de voz | ❌ | Pendiente |
| Forum topics | ❌ | Pendiente |
| Búsqueda dentro de chat | ❓ | Pendiente verificar (`messages.Search`) |

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Navegador del usuario                │
├─────────────────────────────────────────────────────────┤
│  React UI (src/)                                        │
│  └─ TelegramApp.js                                      │
│       └─ Componentes (Calls, ColumnLeft, Tile, etc.)    │
│                                                         │
│  Controllers (src/Controllers/)                         │
│  ├─ ApplicationStore.js   — estado global               │
│  ├─ CallController.js     — WebRTC + DH + tgcalls       │
│  └─ GramJsController.js   — bridge MTProto (caller side)│
│                                                         │
│  GramJS (node_modules/gramjs)                           │
│  └─ MTProto + serialización TL (capa 198)               │
│                                                         │
│  Service Worker (Vite PWA + Workbox)                    │
│  └─ Caché de assets para uso offline                    │
└─────────────────────────────────────────────────────────┘
                          │
                          │ WSS (MTProto sobre WebSocket)
                          ▼
                     Telegram DCs
```

Componentes clave de llamadas:
- `src/Controllers/CallController.js` — máquina de estados, Diffie-Hellman, WebRTC.
- `src/lib/TgCallsSignaling.js` — AES-CTR, gzip, parsing/construcción SDP.
- `src/Utils/GramJs/UpdateTranslator.js` — traduce updates MTProto a formato interno.
- `src/Components/Calls/IncomingCall.js` / `ActiveCall.js` — overlays UI.

## Despliegue local

Requisitos: [Node.js 22 LTS](http://nodejs.org/) y npm.

```bash
git clone https://github.com/ComunidadTelebots/telegram-react.git
cd telegram-react
npm ci --legacy-peer-deps
```

Configuración — crea `.env.local` (en `.gitignore`, no se versiona) con credenciales de [my.telegram.org/apps](https://my.telegram.org/apps):

```
VITE_TELEGRAM_API_ID=tu_api_id
VITE_TELEGRAM_API_HASH=tu_api_hash
```

> **Aviso:** en clientes web el `api_hash` siempre acaba en el bundle JS y es extraíble. Usa una app dedicada a este despliegue, no la misma que uses para otros proyectos. Si Telegram detecta abuso, podría revocarla.

Arrancar:

```bash
npm start         # http://localhost:5173
npm run build     # build de producción en build/
```

## Despliegue en producción

Build estático sirvible por cualquier servidor (nginx, Apache, Caddy):

```bash
VITE_TELEGRAM_API_ID=... VITE_TELEGRAM_API_HASH=... npm run build
```

> **Importante:** si vas a servir desde la raíz del dominio, quita o ajusta la línea `"homepage"` de `package.json` antes del build. De lo contrario el service worker pedirá assets desde `/telegram-react/...` y devolverá 404.

Ejemplo `docker-compose.yml` (nginx + Traefik):

```yaml
services:
  tg-web:
    image: nginx:alpine
    restart: unless-stopped
    volumes:
      - ./build:/usr/share/nginx/html:ro
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.tg.rule=Host(`tg.example.com`)"
      - "traefik.http.routers.tg.entrypoints=websecure"
      - "traefik.http.routers.tg.tls.certresolver=letsencrypt"

networks:
  traefik:
    external: true
```

Headers de seguridad recomendados en nginx:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(self), camera=(self)" always;
```

## Contribuir

1. Abre una issue describiendo qué quieres tocar (bug o feature).
2. Fork + branch desde `master`.
3. Sigue el estilo del código existente (ESLint config heredada del upstream).
4. Si tocas el flujo de llamadas, prueba con un cliente oficial (Android/iOS) en ambas direcciones (caller y callee) — son rutas distintas.
5. PR contra `master` con descripción de qué cambia y cómo se ha probado.

Actualiza el `CHANGELOG.md` con tu cambio en una sección nueva con fecha.

## Seguridad

Reportar vulnerabilidades en privado — no abrir issue público:

- Telegram: [@TodoSobreAllTech](https://t.me/TodoSobreAllTech)

Mejores prácticas si lo autoalojas:

- Sirve siempre por HTTPS (WebRTC y `getUserMedia` lo requieren).
- Aplica los headers de seguridad de arriba.
- Mantén `.env*` fuera del repo (`.gitignore`).
- Considera Content Security Policy estricta (ojo: WebRTC necesita `connect-src` a los DCs de Telegram).

## Hoja de ruta

**Corto plazo:**
- [ ] Race condition DH en `requestCall`.
- [ ] Fallback ICE con TURN real desde `phoneCall.connections`.
- [ ] Editar perfil (`account.UpdateProfile`).
- [ ] Verificar búsqueda dentro de chat (`messages.Search`).

**Medio plazo:**
- [ ] Videollamadas (verificación + pruebas).
- [ ] Mensajes de voz (grabación + envío).
- [ ] Forum topics.
- [x] Service worker migrado a Workbox mediante Vite PWA.

**Largo plazo:**
- [ ] Llamadas grupales (requiere mediasoup/SFU, esfuerzo alto).

## Créditos y licencia

- Base original: [evgeny-nadymov/telegram-react](https://github.com/evgeny-nadymov/telegram-react).
- Mantenedor del fork: [ComunidadTelebots](https://github.com/ComunidadTelebots) — [@TodoSobreAllTech](https://t.me/TodoSobreAllTech).
- Librería MTProto: [GramJS](https://github.com/gram-js/gramjs).

Licencia: GPL-3.0, heredada del upstream.
