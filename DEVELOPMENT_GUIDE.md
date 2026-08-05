# Telegram React - Development Guide

## Quick Start

### Prerequisites
- Node.js v14+ recommended
- npm v6+

### Setup
```bash
# 1. Clone the repository
git clone https://github.com/ComunidadTelebots/telegram-react.git
cd telegram-react

# 2. Install dependencies
npm install

# 3. Copy TDLib files
cp node_modules/tdweb/dist/* public/

# 4. Configure environment
cp .env.example .env.development
# Edit .env.development with your Telegram API credentials
```

### Getting Telegram API Credentials
1. Go to https://my.telegram.org/apps
2. Login with your Telegram account
3. Create an application (if you don't have one)
4. Copy your API ID and API Hash
5. Paste them into `.env.development`

### Development Commands

#### Start Development Server
```bash
npm run start
```
Opens http://localhost:5173 in your browser

#### Code Quality

**Check code quality (lint + format):**
```bash
npm run quality
```

**Fix ESLint issues automatically:**
```bash
npm run lint:fix
```

**Format code with Prettier:**
```bash
npm run format
```

**Check formatting without modifying:**
```bash
npm run format:check
```

#### Testing
```bash
npm run test          # Run tests in watch mode
npm run test:run      # Run tests once (for CI)
```

#### Building

**Development build:**
```bash
npm run build
```

**Production build with bundle analysis:**
```bash
npm run stats
```

**Deploy to GitHub Pages:**
```bash
npm run deploy
```

## Code Standards

### ESLint Rules
We enforce:
- ✅ Strict equality (`===` instead of `==`)
- ✅ Modern variable declarations (`const`/`let` not `var`)
- ✅ No console logs in production code (use `console.warn/error` only)
- ✅ React Hooks best practices
- ✅ PropTypes documentation

### Formatting
- Line length: 120 characters
- Indentation: 4 spaces
- Quotes: Single quotes (`'`)
- Semicolons: Always
- Trailing commas: Yes (for diffs)

### Project Structure
```
src/
├── Actions/           # Redux-like action creators
├── Assets/            # Images, fonts, static files
├── Components/        # React components
│   ├── Auth/
│   ├── Chat/
│   ├── UI/
│   └── ...
├── Controllers/       # Business logic controllers
├── Stores/            # State management stores
├── Utils/             # Utility functions
├── Workers/           # Web Workers
├── TelegramApp.js     # Main app component
└── index.js           # Entry point
```

## Common Tasks

### Adding a New Component
```javascript
import React from 'react';
import PropTypes from 'prop-types';
import './MyComponent.css';

function MyComponent({ prop1, prop2 }) {
    return (
        <div className='my-component'>
            {prop1}
        </div>
    );
}

MyComponent.propTypes = {
    prop1: PropTypes.string.isRequired,
    prop2: PropTypes.number,
};

export default MyComponent;
```

### Adding a New Store
1. Create file in `src/Stores/MyStore.js`
2. Implement store with event handling
3. Export singleton instance
4. Import in components using it

### Styling
- Use CSS files with component (component co-location)
- Follow Material-UI theme colors
- Mobile-first responsive design

## Debugging

### In Browser DevTools
1. Install React Developer Tools extension
2. Check Redux/Store state in Console
3. Use `TdLibController` for API calls

### Console Output
- Use `console.warn('message')` for important messages
- Use `console.error(error)` for errors only
- Regular `console.log()` will fail ESLint

### Performance
```bash
npm run stats
```
Creates the Vite production bundle in analysis mode.

## Git Workflow

### Before Committing
```bash
# 1. Format your code
npm run format

# 2. Fix ESLint issues
npm run lint:fix

# 3. Check everything passes
npm run quality

# 4. Run tests
npm run test
```

### Commit Messages
- Use present tense: "Add feature" not "Added feature"
- Be specific: "Fix null check in ChatStore" not "Fix bug"
- Reference issues: "Closes #123"

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `REACT_APP_TELEGRAM_API_ID` | Telegram API ID | Yes |
| `REACT_APP_TELEGRAM_API_HASH` | Telegram API Hash | Yes |
| `NODE_OPTIONS` | Node.js options | No (set to `--openssl-legacy-provider` by default) |
| `GENERATE_SOURCEMAP` | Enable source maps in build | No |

## Troubleshooting

### "Cannot find module 'tdweb'"
```bash
cp node_modules/tdweb/dist/* public/
```

### ESLint errors
```bash
npm run lint:fix
```

### Port 3000 already in use
```bash
# Linux/Mac
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Dependencies not installing
```bash
rm -rf node_modules package-lock.json
npm install
```

## Performance Tips

1. **Use React DevTools Profiler** to identify slow components
2. **Code splitting**: Use `React.lazy()` for route-based code splitting
3. **Memoization**: Use `React.memo()` for expensive components
4. **Avoid inline functions**: Define functions outside render method
5. **Bundle analysis**: Run `npm run stats` to check bundle size

## Resources

- [React Documentation](https://react.dev)
- [Material-UI v4 Docs](https://material-ui.com/docs/)
- [TDLib Documentation](https://core.telegram.org/tdlib)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)

## Getting Help

1. Check existing issues on GitHub
2. Review similar components for patterns
3. Ask in team Slack/Discord
4. Create a discussion issue with context

## Development Roadmap

- [ ] Update React to v18
- [ ] Migrate Material-UI to v5
- [ ] Add TypeScript support
- [ ] Implement proper error boundaries
- [ ] Add E2E tests with Cypress
- [ ] Optimize bundle size (<500KB gzipped)
