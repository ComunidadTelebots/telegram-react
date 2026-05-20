# Telegram React - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│           React UI Components                           │
│  (TelegramApp, Chat, Message, Settings, etc.)          │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  State Management & Stores                              │
│  (ChatStore, UserStore, MessageStore, etc.)            │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  Controllers                                            │
│  (TdLibController, NotificationController, etc.)       │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  TDLib JavaScript Binding (WebAssembly)                 │
│  Telegram Database Library compiled to WASM             │
└─────────────────────────────────────────────────────────┘
```

## Core Layers

### 1. UI Layer (Components)
- **Location**: `src/Components/`
- **Responsibility**: Render user interface
- **Technology**: React 16 (target: React 18+)
- **Dependencies**: Material-UI v4, React Router v5

**Key Components:**
- `TelegramApp.js` - Root component
- `Components/Auth/` - Authentication flow
- `Components/Chat/` - Chat UI
- `Components/Message/` - Message display
- `Components/Settings/` - Settings UI

### 2. State Management Layer (Stores)
- **Location**: `src/Stores/`
- **Responsibility**: Centralized state management
- **Pattern**: Event-based store pattern (similar to Flux/Redux)
- **No external state library** - Custom implementation

**Key Stores:**
- `ChatStore` - Chat data and messages
- `UserStore` - User profiles
- `NotificationStore` - Notifications
- `LocalizationStore` - i18n management
- `ApplicationStore` - Global app state

### 3. Controller Layer
- **Location**: `src/Controllers/`
- **Responsibility**: Bridge between UI and TDLib
- **Key Components:**
  - `TdLibController` - Main TDLib interface
  - Handles API calls and responses

### 4. Utility Layer
- **Location**: `src/Utils/`
- **Responsibility**: Helper functions
- **Examples:**
  - `Common.js` - Generic utilities
  - `MessageApi.js` - Message formatting
  - `ThemeColors.js` - Theme management

### 5. Workers
- **Location**: `src/Workers/`
- **Responsibility**: Heavy computations off main thread
- **Current**: TDLib worker

## Data Flow

### Request Flow
```
Component
    ↓
TdLibController.send(query)
    ↓
TDLib (WebAssembly)
    ↓
Telegram API
```

### Response Flow
```
TDLib Event
    ↓
TdLibController.receive(update)
    ↓
Store.update(update)
    ↓
Component.setState() → Re-render
```

## Store Pattern (Custom Implementation)

Each store follows this pattern:

```javascript
class MyStore {
    constructor() {
        this.state = {};
    }
    
    addListener(callback) {
        // Observer pattern
    }
    
    removeListener(callback) {}
    
    emit() {
        // Notify observers
    }
}

// Singleton instance
const store = new MyStore();
export default store;
```

## Key Design Patterns

### 1. Observer Pattern
Used in stores for reactive updates:
- Components subscribe to store changes
- Store notifies subscribers when data changes
- No need for Redux or Context API

### 2. Singleton Pattern
Each store is a singleton instance:
```javascript
// Store is created once and reused
export default new ChatStore();
```

### 3. Higher-Order Components (HOCs)
For composing store subscriptions:
```javascript
withLanguage() // i18n
withTheme()    // Theme switching
withSnackbarNotifications() // Notifications
```

### 4. Web Workers
Heavy operations run in separate thread:
- TDLib runs in worker thread
- UI thread stays responsive
- Message-based communication

## File Organization

### Components Directory
```
Components/
├── Auth/              # Authentication screens
├── Chat/              # Chat interface
├── Message/           # Message components
├── Settings/          # User settings
├── UI/                # Reusable UI components
└── Common/            # Shared components
```

### Naming Conventions
- **Components**: PascalCase (e.g., `ChatList.js`)
- **Files**: Same as component name
- **Exports**: Default export for components
- **Styles**: Colocated CSS files (e.g., `ChatList.css`)

## Dependencies

### Core
- **react**: ^16.12.0 (UI framework)
- **react-dom**: ^16.12.0 (DOM rendering)
- **react-router-dom**: ^5.0.0 (Routing)

### Material Design
- **@material-ui/core**: ^4.8.0 (UI components)
- **@material-ui/icons**: ^4.5.1 (Icon set)

### Utilities
- **i18next**: Internationalization
- **notistack**: Notifications
- **lottie-web**: Animations
- **classnames**: CSS class composition
- **dateformat**: Date formatting
- **libphonenumber-js**: Phone number validation

### TDLib
- **telegram**: ^2.26.22 (TDLib Node binding)
- **tdweb**: ^1.8.0 (TDLib WASM version)

## Performance Considerations

### Bundle Size
- Current: ~500KB+ (gzipped)
- **Issues**:
  - TDLib WASM is large (~3MB)
  - Material-UI adds overhead
  - Unused components in bundle

### Optimization Opportunities
1. Code splitting by routes
2. Lazy loading of components
3. Bundle analysis and tree-shaking
4. Image optimization
5. Service Worker caching

## Security Considerations

### Current Practices
- LocalStorage for persistence (consider risks)
- Cookies for authentication state
- HTTPS recommended for production

### Improvements Needed
- Content Security Policy (CSP)
- XSS prevention (React escapes by default)
- CSRF protection
- Secure headers
- Input validation

## Testing Strategy

### Current State
- Test infrastructure in place
- Limited test coverage
- Need E2E tests

### Recommended Approach
1. Unit tests with Jest
2. Component tests with React Testing Library
3. E2E tests with Cypress
4. Visual regression testing

## Deployment

### Build Process
1. Webpack bundling
2. Service Worker generation
3. Asset optimization
4. GitHub Pages deployment

### Environments
- **Development**: `npm run start`
- **Production**: `npm run build` → `npm run deploy`
- **Staging**: Manual build from branch

## Future Architecture Improvements

1. **Migrate to React 18**
   - Concurrent rendering
   - Automatic batching
   - Improved Suspense

2. **Update Material-UI to v5+**
   - Better styling (emotion/styled-components)
   - Improved performance
   - Modern API

3. **Add TypeScript**
   - Type safety
   - Better IDE support
   - Self-documenting code

4. **Implement Proper State Management**
   - Consider Redux or Zustand
   - Better DevTools
   - Time-travel debugging

5. **Error Boundaries**
   - Graceful error handling
   - User-friendly error messages
   - Error reporting

6. **Service Worker Enhancements**
   - Better offline support
   - Background sync
   - Push notifications

## Monitoring & Logging

### Current
- Browser console logs (many need removal)
- Service Worker logging

### Recommended
- Centralized error tracking (Sentry)
- Performance monitoring (Web Vitals)
- User analytics
- Structured logging

## Related Documentation
- See `PROJECT_IMPROVEMENTS.md` for code quality
- See `DEVELOPMENT_GUIDE.md` for setup instructions
- See `IMPROVEMENTS.md` for improvement summary
