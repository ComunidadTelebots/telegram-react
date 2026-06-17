# Changelog

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

